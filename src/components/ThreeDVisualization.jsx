import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Card } from './Card'
import { Badge } from './Badge'

/**
 * Regional atlas — a real map, in three dimensions.
 *
 * The ground is genuine OpenStreetMap raster imagery for the North West
 * Region, fetched tile by tile and laid out in Web Mercator so every
 * pixel sits where it belongs. Division headquarters are placed by their
 * true coordinates and projected through the same transform, so a column
 * standing over Kumbo really is standing over Kumbo.
 *
 * Column height encodes the number of programmes on the roll; column
 * colour encodes the rate of budget execution. Nothing here is decorative
 * — every dimension carries a figure a member could be asked about.
 */

const ZOOM = 9

/* Tile providers, tried in order. Carto's light basemap is first: it is
   built for application use and its muted palette sits naturally against
   the parchment surface. Standard OSM is the fallback. */
const TILE_PROVIDERS = [
  (z, x, y) => `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`,
  (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
]

/* If the network is slow or blocked, stop waiting and show the geometry. */
const TILE_TIMEOUT_MS = 9000

/* Bounding box of the North West Region, generous enough to show the
   whole territory plus a margin of neighbouring ground for context. */
const BBOX = { west: 9.6, east: 11.2, south: 5.6, north: 7.1 }

const WORLD_PER_TILE = 30

/* Division headquarters, by true coordinate. Programme counts and
   execution rates mirror the figures reported on the Chamber overview. */
const DIVISIONS = [
  { name: 'Mezam',         seat: 'Bamenda', lat: 5.9631, lon: 10.1591, projects: 5, exec: 0.94, capital: true },
  { name: 'Momo',          seat: 'Mbengwi', lat: 5.9308, lon:  9.9997, projects: 3, exec: 0.78 },
  { name: 'Menchum',       seat: 'Wum',     lat: 6.3833, lon: 10.0667, projects: 4, exec: 0.81 },
  { name: 'Boyo',          seat: 'Fundong', lat: 6.2500, lon: 10.2667, projects: 1, exec: 0.72 },
  { name: 'Ngoketunjia',   seat: 'Ndop',    lat: 5.9833, lon: 10.4333, projects: 1, exec: 0.70 },
  { name: 'Bui',           seat: 'Kumbo',   lat: 6.2000, lon: 10.6667, projects: 1, exec: 0.68 },
  { name: 'Donga-Mantung', seat: 'Nkambe',  lat: 6.5833, lon: 10.6667, projects: 1, exec: 0.65 },
]

/* ── Web Mercator ── */
const lonToTileX = (lon, z) => ((lon + 180) / 360) * 2 ** z
const latToTileY = (lat, z) => {
  const r = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z
}

/* Execution rate → colour ramp: rust (behind) through brass to highland green (on target). */
function execColor(exec) {
  const behind = new THREE.Color('#A33C1B')
  const middle = new THREE.Color('#A88028')
  const onTrack = new THREE.Color('#2F6B4F')
  const t = Math.min(Math.max((exec - 0.6) / 0.35, 0), 1)
  return t < 0.5
    ? behind.clone().lerp(middle, t * 2)
    : middle.clone().lerp(onTrack, (t - 0.5) * 2)
}

/** Renders a division label into a sprite so it always faces the camera. */
function makeLabel(text, sub) {
  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = 256 * scale
  canvas.height = 80 * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  ctx.fillStyle = 'rgba(252, 250, 244, 0.94)'
  ctx.strokeStyle = 'rgba(120, 112, 92, 0.9)'
  ctx.lineWidth = 1.5
  const r = 6
  ctx.beginPath()
  ctx.roundRect(4, 14, 248, 46, r)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#15160F'
  ctx.font = '600 22px "Instrument Sans", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(text, 128, 38)

  ctx.fillStyle = '#4A4436'
  ctx.font = '500 15px "JetBrains Mono", monospace'
  ctx.fillText(sub, 128, 54)

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  )
  sprite.scale.set(17, 5.3, 1)
  sprite.renderOrder = 10
  return sprite
}

export function ThreeDVisualization() {
  const mountRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [tilesLoaded, setTilesLoaded] = useState(0)
  const [selected, setSelected] = useState(null)

  /* Tile grid covering the bounding box. */
  const grid = useMemo(() => {
    const x0 = Math.floor(lonToTileX(BBOX.west, ZOOM))
    const x1 = Math.floor(lonToTileX(BBOX.east, ZOOM))
    const y0 = Math.floor(latToTileY(BBOX.north, ZOOM))
    const y1 = Math.floor(latToTileY(BBOX.south, ZOOM))
    return {
      x0, x1, y0, y1,
      cols: x1 - x0 + 1,
      rows: y1 - y0 + 1,
      originX: (x0 + x1 + 1) / 2,
      originY: (y0 + y1 + 1) / 2,
    }
  }, [])

  const totalTiles = grid.cols * grid.rows

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let raf = 0
    let disposed = false

    const width = mount.clientWidth || 800
    const height = 460

    const scene = new THREE.Scene()
    const isDark = document.documentElement.classList.contains('dark')
    scene.background = new THREE.Color(isDark ? '#12130E' : '#E9E3D3')
    scene.fog = new THREE.Fog(scene.background, 260, 560)

    /* Frame the divisions themselves, not the bounding box: they sit east
       of the box centre, so centring on the box would push them off-frame. */
    const focus = DIVISIONS.reduce(
      (acc, d) => {
        acc.x += (lonToTileX(d.lon, ZOOM) - grid.originX) * WORLD_PER_TILE
        acc.z += (latToTileY(d.lat, ZOOM) - grid.originY) * WORLD_PER_TILE
        return acc
      },
      { x: 0, z: 0 }
    )
    focus.x /= DIVISIONS.length
    focus.z /= DIVISIONS.length

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 2000)
    camera.position.set(focus.x - 20, 104, focus.z + 112)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 45
    controls.maxDistance = 300
    controls.maxPolarAngle = Math.PI / 2.15
    controls.target.set(focus.x, 10, focus.z)

    /* ── Lighting ── */
    scene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.55 : 0.85))
    const sun = new THREE.DirectionalLight(0xfff4e0, isDark ? 0.9 : 1.15)
    sun.position.set(-70, 150, 90)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -160
    sun.shadow.camera.right = 160
    sun.shadow.camera.top = 160
    sun.shadow.camera.bottom = -160
    sun.shadow.camera.far = 420
    scene.add(sun)

    /* ── Ground: real OSM tiles in Web Mercator ── */
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    const groundGroup = new THREE.Group()
    scene.add(groundGroup)

    let loaded = 0
    let failed = 0

    const settle = () => {
      if (disposed) return
      if (loaded + failed >= totalTiles) {
        setStatus(loaded === 0 ? 'nomap' : 'ready')
      }
    }

    for (let tx = grid.x0; tx <= grid.x1; tx++) {
      for (let ty = grid.y0; ty <= grid.y1; ty++) {
        const geo = new THREE.PlaneGeometry(WORLD_PER_TILE, WORLD_PER_TILE)
        const mat = new THREE.MeshLambertMaterial({
          color: isDark ? 0x9a9a90 : 0xffffff,
        })
        const plane = new THREE.Mesh(geo, mat)
        plane.rotation.x = -Math.PI / 2
        plane.position.set(
          (tx + 0.5 - grid.originX) * WORLD_PER_TILE,
          0,
          (ty + 0.5 - grid.originY) * WORLD_PER_TILE
        )
        plane.receiveShadow = true
        groundGroup.add(plane)

        // Walk the provider list until one serves this tile.
        const attempt = (providerIdx) => {
          if (disposed) return
          if (providerIdx >= TILE_PROVIDERS.length) {
            failed++
            mat.color.set(isDark ? 0x2a2c24 : 0xded8c6)
            mat.needsUpdate = true
            settle()
            return
          }
          loader.load(
            TILE_PROVIDERS[providerIdx](ZOOM, tx, ty),
            (tex) => {
              if (disposed) { tex.dispose(); return }
              tex.colorSpace = THREE.SRGBColorSpace
              tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
              tex.minFilter = THREE.LinearMipmapLinearFilter
              mat.map = tex
              mat.color.set(0xffffff)
              mat.needsUpdate = true
              loaded++
              setTilesLoaded(loaded)
              settle()
            },
            undefined,
            () => attempt(providerIdx + 1)
          )
        }
        attempt(0)
      }
    }

    /* Never leave the reader staring at a spinner: after the timeout the
       geometry is shown regardless of how many tiles arrived. */
    const timeoutId = setTimeout(() => {
      if (disposed) return
      setStatus((s) => (s === 'loading' ? (loaded === 0 ? 'nomap' : 'ready') : s))
    }, TILE_TIMEOUT_MS)

    /* ── Division columns, placed by true coordinate ── */
    const markers = []
    const columnGroup = new THREE.Group()
    scene.add(columnGroup)

    DIVISIONS.forEach((d) => {
      const wx = (lonToTileX(d.lon, ZOOM) - grid.originX) * WORLD_PER_TILE
      const wz = (latToTileY(d.lat, ZOOM) - grid.originY) * WORLD_PER_TILE
      const h = 10 + d.projects * 7

      const color = execColor(d.exec)
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(3.1, 3.6, h, 6),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.55,
          metalness: 0.12,
          emissive: color.clone().multiplyScalar(isDark ? 0.32 : 0.06),
        })
      )
      column.position.set(wx, h / 2, wz)
      column.castShadow = true
      column.userData = d
      columnGroup.add(column)
      markers.push(column)

      // Footprint ring on the map surface
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(4.6, 6.2, 32),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
        })
      )
      ring.rotation.x = -Math.PI / 2
      ring.position.set(wx, 0.35, wz)
      columnGroup.add(ring)

      // The regional capital gets a diamond finial, echoing the app's ornament
      if (d.capital) {
        const finial = new THREE.Mesh(
          new THREE.OctahedronGeometry(3.4),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color('#B0431F'),
            emissive: new THREE.Color('#B0431F').multiplyScalar(0.35),
            roughness: 0.35,
          })
        )
        finial.position.set(wx, h + 6, wz)
        finial.castShadow = true
        finial.userData = { ...d, finial: true }
        columnGroup.add(finial)
        markers.push(finial)
      }

      const label = makeLabel(d.name, `${d.seat} · ${Math.round(d.exec * 100)}%`)
      label.position.set(wx, h + (d.capital ? 16 : 6.5), wz)
      columnGroup.add(label)
    })

    /* ── Hover & selection ── */
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let hovered = null

    const onPointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(markers, false)[0]
      const obj = hit?.object || null
      if (hovered !== obj) {
        if (hovered) hovered.scale.setScalar(1)
        hovered = obj
        if (hovered) hovered.scale.setScalar(1.12)
        renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab'
      }
    }

    const onClick = () => {
      if (hovered) setSelected(hovered.userData)
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.style.cursor = 'grab'

    /* ── Resize ── */
    const onResize = () => {
      const w = mount.clientWidth || 800
      camera.aspect = w / height
      camera.updateProjectionMatrix()
      renderer.setSize(w, height)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(mount)

    /* ── Render loop ── */
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      columnGroup.children.forEach((child) => {
        if (child.userData?.finial) child.rotation.y = t * 0.6
      })
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      clearTimeout(timeoutId)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('click', onClick)
      controls.dispose()
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          mats.forEach((m) => { m.map?.dispose(); m.dispose() })
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [grid, totalTiles])

  return (
    <Card>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Cartography</p>
          <h3 className="text-[1.0625rem] font-semibold mt-1 leading-tight">
            Regional atlas in three dimensions
          </h3>
        </div>
        <Badge variant={status === 'nomap' ? 'warning' : 'success'}>
          {status === 'ready'
            ? 'Live basemap'
            : status === 'nomap'
              ? 'Basemap unavailable'
              : `${tilesLoaded}/${totalTiles} tiles`}
        </Badge>
      </div>

      <p className="text-[color:var(--sepia)] mb-4 max-w-3xl leading-relaxed">
        Real OpenStreetMap imagery of the North West Region, projected in Web
        Mercator. Each column stands over its division headquarters at the
        true coordinate: height is the number of programmes on the roll,
        colour is the rate of budget execution.
      </p>

      <div className="relative rounded-[4px] border border-[color:var(--rule-firm)] overflow-hidden bg-[color:var(--linen)]">
        {/* Status sits over the scene rather than hiding it — the columns
            and their coordinates are meaningful with or without imagery. */}
        {status !== 'ready' && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[3px] bg-[color:var(--card-bg)]/92 border border-[color:var(--rule)]">
              {status === 'loading' ? (
                <>
                  <span className="w-2.5 h-2.5 rotate-45 border border-[color:var(--kola)] animate-pulse" />
                  <span className="eyebrow text-[0.55rem]">
                    Fetching basemap — {tilesLoaded}/{totalTiles}
                  </span>
                </>
              ) : (
                <span className="eyebrow text-[0.55rem] text-[color:var(--brass-ink)]">
                  Basemap offline · coordinates and figures still exact
                </span>
              )}
            </div>
          </div>
        )}
        <div ref={mountRef} style={{ height: 460 }} />
      </div>

      {/* Legend + readout */}
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[0.55rem]">Execution</span>
            <span
              className="h-2 w-24 rounded-full"
              style={{ background: 'linear-gradient(90deg,#A33C1B,#A88028,#2F6B4F)' }}
            />
            <span className="mono text-[0.65rem] text-[color:var(--sepia)]">60 → 95%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[0.55rem]">Height</span>
            <span className="mono text-[0.65rem] text-[color:var(--sepia)]">programmes on the roll</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rotate-45 bg-[color:var(--kola)]" />
            <span className="mono text-[0.65rem] text-[color:var(--sepia)]">Regional capital</span>
          </div>
          <span className="mono text-[0.6rem] text-[color:var(--sepia-soft)]">
            Drag to orbit · scroll to zoom · click a column
          </span>
        </div>

        {selected && (
          <div className="border border-[color:var(--rule)] rounded-[4px] px-3.5 py-2.5 bg-[color:var(--linen)] min-w-[210px]">
            <p className="eyebrow text-[0.55rem]">{selected.seat}</p>
            <p className="font-semibold mt-0.5">{selected.name} Division</p>
            <div className="flex items-baseline gap-4 mt-2">
              <span className="mono text-xs text-[color:var(--sepia)]">
                {selected.projects} programme{selected.projects === 1 ? '' : 's'}
              </span>
              <span className="mono text-xs text-[color:var(--sepia)]">
                {Math.round(selected.exec * 100)}% executed
              </span>
            </div>
            <p className="mono text-[0.6rem] text-[color:var(--sepia-soft)] mt-1.5">
              {selected.lat.toFixed(4)}°N · {selected.lon.toFixed(4)}°E
            </p>
          </div>
        )}
      </div>

      <p className="mono text-[0.6rem] text-[color:var(--sepia-soft)] mt-3 pt-3 border-t border-[color:var(--rule)]">
        Base imagery © OpenStreetMap contributors
      </p>
    </Card>
  )
}
