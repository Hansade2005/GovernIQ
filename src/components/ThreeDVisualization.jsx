import { useEffect, useRef, useState } from 'react'
import { Card } from './Card'

export function ThreeDVisualization() {
  const containerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [useOSM, setUseOSM] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    // Load Babylon.js script
    const script = document.createElement('script')
    script.src = 'https://cdn.babylonjs.com/babylon.js'
    script.async = true

    script.onload = () => {
      setTimeout(() => {
        if (useOSM) {
          initOSMScene()
        } else {
          initScene()
        }
      }, 100)
    }

    script.onerror = () => {
      setError('Failed to load Babylon.js')
      setIsLoading(false)
    }

    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [useOSM])

  const initOSMScene = async () => {
    try {
      const BABYLON = window.BABYLON
      if (!BABYLON) {
        throw new Error('BABYLON not loaded')
      }

      // OSM2World geographic rendering — planned for Phase 4
      // For now, show informational message and auto-fallback to schematic
      setError('Geographic mode coming in Phase 4 — OSM2World integration in progress. Using schematic view.')
      setIsLoading(false)
      
      // Auto-fallback to schematic after 3 seconds
      setTimeout(() => {
        if (containerRef.current) {
          const canvas = containerRef.current.querySelector('canvas')
          if (canvas) {
            canvas.parentNode?.removeChild(canvas)
          }
        }
        setUseOSM(false)
      }, 3000)
    } catch (err) {
      console.error('OSM scene init error:', err)
      setError('Geographic mode unavailable — switching to schematic view.')
      setIsLoading(false)
      setTimeout(() => setUseOSM(false), 2000)
    }
  }

  const initScene = () => {
    try {
      const BABYLON = window.BABYLON
      if (!BABYLON) {
        throw new Error('BABYLON not loaded')
      }

      const canvas = document.createElement('canvas')
      containerRef.current?.appendChild(canvas)

      const engine = new BABYLON.Engine(canvas, true)
      const scene = new BABYLON.Scene(engine)
      scene.clearColor = new BABYLON.Color3(0.85, 0.9, 0.95)
      scene.collisionsEnabled = true

      // Camera
      const camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2.5, 100, new BABYLON.Vector3(0, 0, 0))
      camera.attachControl(canvas, true)
      camera.lowerRadiusLimit = 40
      camera.upperRadiusLimit = 150

      // Lights
      const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0))
      light1.intensity = 0.8

      const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(20, 40, 20))
      light2.intensity = 0.6

      // Regions data
      const regions = [
        { name: 'Mezam', x: 0, z: 0, scale: 1.2, color: [0.2, 0.4, 0.8], projects: 5 },
        { name: 'Momo', x: 30, z: 20, scale: 1.1, color: [0.8, 0.2, 0.6], projects: 6 },
        { name: 'Menchum', x: -30, z: 15, scale: 1.0, color: [0.9, 0.3, 0.3], projects: 4 },
        { name: 'Kweneng', x: 25, z: -25, scale: 0.95, color: [0.95, 0.6, 0.2], projects: 4 },
        { name: 'Boyo', x: -25, z: -20, scale: 0.9, color: [0.1, 0.7, 0.5], projects: 3 },
        { name: 'Manyu', x: -40, z: -30, scale: 0.9, color: [0.4, 0.5, 0.9], projects: 4 },
      ]

      // Create division boxes
      regions.forEach((region, idx) => {
        const box = BABYLON.MeshBuilder.CreateBox('box' + idx, {
          width: 12 * region.scale,
          height: 18 * region.scale,
          depth: 10 * region.scale,
        })
        box.position.x = region.x
        box.position.z = region.z
        box.position.y = 9 * region.scale

        const mat = new BABYLON.StandardMaterial('mat' + idx)
        mat.diffuse = new BABYLON.Color3(region.color[0], region.color[1], region.color[2])
        mat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3)
        mat.alpha = 0.9
        box.material = mat

        // Store data for animation
        box.data = { idx, region }
      })

      // Center sphere (Bamenda)
      const center = BABYLON.MeshBuilder.CreateSphere('center', { diameter: 10 })
      center.position.y = 25
      const centerMat = new BABYLON.StandardMaterial('centerMat')
      centerMat.diffuse = new BABYLON.Color3(1, 0.85, 0)
      centerMat.emissiveColor = new BABYLON.Color3(1, 0.6, 0)
      center.material = centerMat

      // Render loop
      let tick = 0
      engine.runRenderLoop(() => {
        tick++
        scene.meshes.forEach((mesh) => {
          if (mesh.name.startsWith('box')) {
            mesh.rotation.y += 0.002
            mesh.position.y = mesh.data.region.scale * 9 + Math.sin(tick * 0.01 + mesh.data.idx) * 1.5
          }
        })
        center.rotation.y += 0.005
        scene.render()
      })

      // Resize handler
      window.addEventListener('resize', () => {
        engine.resize()
      })

      setIsLoading(false)
    } catch (err) {
      console.error('Scene init error:', err)
      setError('Failed to initialize 3D scene')
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold font-display text-foreground">3D Region Map</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {useOSM 
              ? 'Real OpenStreetMap geographic data for Bamenda area'
              : 'Interactive 3D visualization of Northwest Region divisions'
            }
          </p>
        </div>
        <button
          onClick={() => {
            // Clear container
            if (containerRef.current) {
              const canvas = containerRef.current.querySelector('canvas')
              if (canvas) {
                canvas.parentNode?.removeChild(canvas)
              }
            }
            setIsLoading(true)
            setError(null)
            setUseOSM(!useOSM)
          }}
          className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          {useOSM ? 'View Schematic' : 'View Geographic'}
        </button>
      </div>

      <div className="relative w-full rounded-lg border border-border overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center">
              <div className="inline-block mb-3">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {useOSM ? 'Loading geographic data...' : 'Rendering 3D map...'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center p-4">
              <p className="text-amber-600 text-sm font-medium">ℹ️ {error}</p>
              {useOSM && (
                <button
                  onClick={() => {
                    if (containerRef.current) {
                      const canvas = containerRef.current.querySelector('canvas')
                      if (canvas) {
                        canvas.parentNode?.removeChild(canvas)
                      }
                    }
                    setIsLoading(true)
                    setError(null)
                    setUseOSM(false)
                  }}
                  className="mt-3 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Return to Schematic
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={containerRef} style={{ minHeight: '400px' }} />
      </div>

      <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs">
        <p className="text-muted-foreground">
          <strong>Controls:</strong> Drag to rotate • Scroll to zoom • Right-click to pan
        </p>
        {useOSM ? (
          <p className="text-muted-foreground mt-2">
            Geographic view shows real OpenStreetMap data for the Bamenda region (5.95-6.05°N, 10.14-10.24°E), including buildings, roads, and terrain. Data sourced from OSM2World and Overpass API.
          </p>
        ) : (
          <p className="text-muted-foreground mt-2">
            Colored blocks represent divisions: Mezam (center), Momo, Menchum, Kweneng, Boyo, Manyu. Yellow sphere marks Bamenda regional headquarters.
          </p>
        )}
      </div>
    </Card>
  )
}
