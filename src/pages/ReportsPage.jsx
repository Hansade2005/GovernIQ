import { PageHeader } from '@/components/PageHeader'
import { useState } from 'react'
import React from 'react'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { 
  FileText, Download, Calendar, Users, Sparkles, ChevronDown, ChevronUp,
  BarChart3, Clock, CheckCircle, AlertCircle, MapPin, BookOpen, Award, Users2,
  Archive, Mail, DollarSign, FolderOpen, Database
} from 'lucide-react'
import { pp } from '@/lib/pipilot'

export function ReportsPage() {
  const [expandedSection, setExpandedSection] = useState('rec')
  const [selectedReport, setSelectedReport] = useState(null)
  const [aiSummaries, setAiSummaries] = useState({})
  const [loadingSummary, setLoadingSummary] = useState(null)
  const [expandedArchiveSection, setExpandedArchiveSection] = useState(null)

  // Archive storage categories with real institutional documents
  const archiveCategories = {
    reports: {
      name: 'Session Reports & Minutes',
      icon: FileText,
      color: 'from-blue-100 to-blue-50',
      borderColor: 'border-l-4 border-l-blue-500',
      items: [
        {
          id: 'rep-1',
          title: 'NWRA General Report - March 2026 Session',
          date: '2026-05-29',
          description: 'Consolidated official minutes covering 2025 Accounts Session, committee elections, financial adoption, and eight deliberations',
          downloadUrl: '/NWRA_General_Report_March2026.pdf',
          size: '2.1 MB',
          keywords: ['accounts', 'budget', 'deliberations', 'governance']
        },
        {
          id: 'rep-2',
          title: 'NWRA General Region Report',
          date: '2026-05-15',
          description: 'Comprehensive regional development report covering all divisions and strategic initiatives',
          downloadUrl: '/NWRA_General_Region_Report.pdf',
          size: '1.8 MB',
          keywords: ['regional', 'development', 'divisions', 'initiatives']
        },
      ]
    },
    memos: {
      name: 'Memos & Circulars',
      icon: Mail,
      color: 'from-purple-100 to-purple-50',
      borderColor: 'border-l-4 border-l-purple-500',
      items: [
        {
          id: 'memo-1',
          title: 'REC Decision No. 00096630 - Session Convening Instrument',
          date: '2026-05-14',
          description: 'Official convening decision for March 2026 Ordinary Session dated 14 May 2026',
          sender: 'Regional Executive Council',
          reference: 'Decision No. 00096630/14 May 2026',
          size: '145 KB',
          keywords: ['convening', 'decision', 'session']
        },
        {
          id: 'memo-2',
          title: 'Secretary-General Letter No. 137/SG/DAG - HOC Approval',
          date: '2026-05-28',
          description: 'House of Chiefs formal approval of all eight deliberations',
          sender: 'Secretary-General',
          reference: 'Letter No. 137/SG/DAG/28 May 2026',
          size: '78 KB',
          keywords: ['house', 'chiefs', 'approval', 'deliberations']
        },
        {
          id: 'memo-3',
          title: 'MINDEVEL Letter No. 000475/L - Staff Recruitment Authorization',
          date: '2026-02-19',
          description: 'Ministerial authorization for REC to recruit additional staff',
          sender: 'Ministry of Decentralization',
          reference: 'Letter No. 000475/L/19 Feb 2026',
          size: '62 KB',
          keywords: ['recruitment', 'authorization', 'staff']
        },
      ]
    },
    committees: {
      name: 'Committee Reports & Documents',
      icon: BarChart3,
      color: 'from-green-100 to-green-50',
      borderColor: 'border-l-4 border-l-green-500',
      items: [
        {
          id: 'com-1',
          title: 'Finance, Budget & Investment Committee Report',
          date: '2026-05-28',
          description: 'Comprehensive recommendations on budget execution, project spending, and financial controls',
          committee: 'Finance Committee',
          highlights: ['CAC fund usage', 'Devolved competencies', 'Budget ratios', 'Project maturity'],
          downloadUrl: '/Finance_Budget_Investment_Committee.pdf',
          size: '892 KB',
          keywords: ['finance', 'budget', 'investment', 'spending']
        },
        {
          id: 'com-2',
          title: 'Education Committee Report',
          date: '2026-05-28',
          description: 'Education sector status: 100% project execution rate, recommendations for curriculum and infrastructure',
          committee: 'Education Committee',
          highlights: ['100% execution rate', 'Anglo-Saxon model review', 'Intelligent classrooms', 'Classroom construction debts'],
          size: '456 KB',
          keywords: ['education', 'schools', 'curriculum', 'projects']
        },
        {
          id: 'com-3',
          title: 'Health, Population & Social Affairs Committee Report',
          date: '2026-05-28',
          description: 'Health sector status and recommendations for district hospitals, sports, wellness centers',
          committee: 'Health Committee',
          highlights: ['District hospitals', 'Sports programs', 'Wellness centers', 'Member health training'],
          size: '534 KB',
          keywords: ['health', 'population', 'social', 'welfare']
        },
        {
          id: 'com-4',
          title: 'Environment & Regional Development Committee Report',
          date: '2026-05-28',
          description: 'Environmental management, DRM integration, regional development priorities',
          committee: 'Environment Committee',
          highlights: ['Tree planting guide', 'Sacred site protection', 'Disaster risk management', 'Digital mapping'],
          size: '612 KB',
          keywords: ['environment', 'development', 'sustainability', 'climate']
        },
      ]
    },
    projectbank: {
      name: 'Project Bank & Development Portfolio',
      icon: FolderOpen,
      color: 'from-amber-100 to-amber-50',
      borderColor: 'border-l-4 border-l-amber-500',
      items: [
        {
          id: 'proj-1',
          title: 'GHS Classroom Blocks - Momo Division (COMPLETED)',
          division: 'Momo',
          status: 'Completed 100%',
          description: '12 modern classroom blocks with ICT facilities, 1,200 student capacity, ready for 2026 enrollment',
          budget: '128M FCFA',
          executionRate: '100%',
          keywords: ['education', 'infrastructure', 'classroom', 'ICT']
        },
        {
          id: 'proj-2',
          title: 'Wum District Hospital Fence Project',
          division: 'Mezam',
          status: 'Contracted',
          description: 'Health facility security and containment project approved for commencement',
          budget: '45M FCFA',
          executionRate: '0%',
          keywords: ['health', 'hospital', 'security', 'infrastructure']
        },
        {
          id: 'proj-3',
          title: 'Bamenda-Bafut-Wom Road Infrastructure Project',
          division: 'Multi-divisional',
          status: 'Advanced Construction',
          description: 'Major transportation infrastructure with ESIA approval, Lake Ilum deviation under study, AfDB funded (~13.4B FCFA compensation)',
          budget: '~36B FCFA (total with compensation)',
          executionRate: '~90-94%',
          keywords: ['infrastructure', 'roads', 'transportation', 'AfDB']
        },
        {
          id: 'proj-4',
          title: 'Digital Entrepreneurship Hub - Mezam',
          division: 'Mezam',
          status: 'Phase 2 Active',
          description: 'Regional digital innovation center supporting 40+ entrepreneurs and digital skills training',
          budget: '3.4B FCFA',
          executionRate: '78%',
          keywords: ['digital', 'entrepreneurship', 'innovation', 'skills']
        },
        {
          id: 'proj-5',
          title: 'North West Development & Investment Fund (NOWEDIF)',
          division: 'Regional',
          status: 'Operational',
          description: 'Regional development financing mechanism supporting bottom-up development projects',
          budget: 'Multi-year allocation',
          executionRate: '65%',
          keywords: ['development', 'finance', 'investment', 'regional']
        },
        {
          id: 'proj-6',
          title: 'Peace & Development Initiative (PDI) Phase Two',
          division: 'All 7 Divisions',
          status: 'Active',
          description: 'Community-driven peace and development program with 418 youth employed in Q2 2026, high-intensity labor approach',
          budget: '2.1B FCFA Phase 2',
          executionRate: '72%',
          keywords: ['peace', 'development', 'community', 'youth']
        },
      ]
    },
    finance: {
      name: 'Finance & Accounts',
      icon: DollarSign,
      color: 'from-red-100 to-red-50',
      borderColor: 'border-l-4 border-l-red-500',
      items: [
        {
          id: 'fin-1',
          title: '2025 Administrative Account - ADOPTED',
          date: '2026-05-26',
          description: '2025 fiscal accounts with 96.6% execution rate (97.5% confirmed by Finance Controller)',
          type: 'Account',
          executionRate: '96.6%',
          totalBudget: '10,331,257,601 FCFA',
          investment: '8,503,857,869 FCFA (98.92%)',
          recurrent: '1,570,025,654 FCFA (90.50%)',
          highlights: ['Full staff salaries paid', 'All 5 sessions funded', 'Investment-heavy 83% share', '225M FCFA deficit (local tax)'],
          downloadUrl: '/NWRA_General_Report_March2026.pdf',
          size: '2.1 MB',
          keywords: ['budget', 'execution', 'accounts', 'fiscal']
        },
        {
          id: 'fin-2',
          title: 'Finance Controller Report 2025 - ADOPTED',
          date: '2026-05-26',
          description: 'Financial Controller audit report confirming 97.5% execution, identifying 5 key challenges',
          type: 'Audit Report',
          executionRate: '97.5%',
          highlights: ['Investment: 98.6%', 'Recurrent: 92.0%', 'Financial autonomy limited to 51%', 'Zero local-tax collection', 'SIMBA/PROGBIS system gaps'],
          recommendations: 'Manual adoption, training workshops, local-tax disbursement trigger, system upgrades (English interfaces)',
          downloadUrl: '/NWRA_General_Report_March2026.pdf',
          size: '2.1 MB',
          keywords: ['audit', 'finance', 'control', 'recommendations']
        },
        {
          id: 'fin-3',
          title: '2026 Adjusted Budget - ADOPTED (20.8B FCFA)',
          date: '2026-05-28',
          description: 'Adjusted 2026 budget approved and balanced at roughly 20.8 billion FCFA, representing regional growth trajectory',
          type: 'Budget',
          totalBudget: '20,808,152,316 FCFA (Day 3) / 20,818,152,360 FCFA (Closing - reconcile)',
          growthTrajectory: '3B → 5B → 10B → ~20.8B FCFA (trajectory of decentralization)',
          highlights: ['Balanced budget', 'Investment-focused allocation', 'Hall-leasing revenue 100K FCFA/day', 'Anti-Corruption Unit funded'],
          downloadUrl: '/NWRA_General_Report_March2026.pdf',
          size: '2.1 MB',
          keywords: ['budget', '2026', 'approved', 'balanced']
        },
        {
          id: 'fin-4',
          title: '2025 Management Account - ADOPTED',
          date: '2026-05-26',
          description: 'Treasurer account for State Audit Court with revenue, expenditure, and fund movement reconciliation',
          type: 'Treasury Account',
          totalRevenue: '1,344,481,159 FCFA',
          totalExpenditure: '1,343,622,447 FCFA',
          cashBalance: '+808,712 FCFA (31 Dec 2025)',
          unpaidBills: '223,852,245 FCFA (carried to 2026)',
          highlights: ['PMG fund movements', 'Taxes paid and reconciled', 'Minor CIMBA anomalies noted'],
          downloadUrl: '/NWRA_General_Report_March2026.pdf',
          size: '2.1 MB',
          keywords: ['treasury', 'accounts', 'revenue', 'expenditure']
        },
        {
          id: 'fin-5',
          title: '2025 Stores Account - ADOPTED',
          date: '2026-05-26',
          description: 'Stores Accountant report on procurement, inventory, and assets valued at 2.7B FCFA',
          type: 'Stores Account',
          totalValue: '2,719,195,719 FCFA',
          consumables: 'Consumables, durables, and services',
          highlights: ['Furniture: 192.8M FCFA', 'Tools & devices: 280.4M FCFA', 'Library materials: 162.2M FCFA', '83% infrastructure/equipment'],
          downloadUrl: '/NWRA_General_Report_March2026.pdf',
          size: '2.1 MB',
          keywords: ['stores', 'inventory', 'assets', 'procurement']
        },
      ]
    },
  }

  // Enhanced governance bodies with real extracted data
  const governanceBodies = {
    rec: {
      name: 'Regional Executive Council',
      icon: Users2,
      color: 'from-blue-100 to-blue-50',
      borderColor: 'border-l-4 border-l-blue-500',
      reports: [
        {
          id: 'rec-1',
          title: 'REC Session #12 - August 2026',
          date: '2026-08-05',
          type: 'Minutes',
          status: 'active',
          content: 'Regional Executive Council monthly session. Q3 budget execution report showing 97.5% completion. Approval of Wum District Hospital fence project commencement. Endorsement of new data security protocols addressing SIMBA/PROGBIS integration. Appointment of four new audit committee members per CONAC framework.',
          attendees: 12,
          duration: '180 minutes',
          keyDecisions: ['Q3 budget execution confirmed at 97.5%', 'Hospital project authorized for immediate start', 'Security protocols adopted with timeline', 'Audit team expanded and trained'],
        },
        {
          id: 'rec-2',
          title: 'REC Session #11 - July 2026',
          date: '2026-07-28',
          type: 'Deliberations',
          status: 'archived',
          content: 'Quarterly performance review and budget allocation confirmation. Infrastructure priorities set: Mezam Division 45% (roads, digital hub), Momo Division 25% (education, vocational training), Boyo Division 15% (healthcare, water supply), remaining 15% for administration. PDI Phase Two implementation challenges discussed with solutions for payment verification and contractor accountability.',
          attendees: 12,
          duration: '165 minutes',
          keyDecisions: ['Budget allocation by division confirmed', 'Infrastructure priorities endorsed', 'PDI payment verification protocol adopted'],
        },
      ]
    },
    fc: {
      name: 'Finance Controller & Accounts',
      icon: DollarSign,
      color: 'from-green-100 to-green-50',
      borderColor: 'border-l-4 border-l-green-500',
      reports: [
        {
          id: 'fc-1',
          title: 'Financial Controller 2025 Report - ADOPTED',
          date: '2026-05-26',
          type: 'Audit Report',
          status: 'active',
          content: 'Comprehensive financial control audit confirming overall budget execution at 97.5% (investment 98.6%, recurrent 92.0%). Identified five key challenges: (1) Limited financial autonomy with 49% of income in partner institutions; (2) Complexity of multi-stakeholder PDI requiring enhanced oversight; (3) Digital system limitations (SIMBA and PROGBIS physically separated, French-only interfaces); (4) Zero local-tax collection despite 600M FCFA projection; (5) Sixty late investment files outstanding at statutory closure. Recommended procedural manual finalization, public-finance training, local-tax disbursement trigger, system English interfaces.',
          attendees: 15,
          duration: '120 minutes',
          keyDecisions: ['Audit findings acknowledged', 'Recommendations accepted for implementation', 'English-language system upgrade prioritized', 'Finance Control unit staffing approved'],
          highlights: ['97.5% execution rate', '0% local-tax collection', '49% financial autonomy', 'System upgrade needed', 'Manual completion urgent'],
        },
      ]
    },
    divisions: {
      name: 'Divisional Representatives Reports',
      icon: MapPin,
      color: 'from-red-100 to-red-50',
      borderColor: 'border-l-4 border-l-red-500',
      reports: [
        {
          id: 'div-1',
          title: 'Mezam Division Report - March 2026 Session',
          date: '2026-05-28',
          type: 'Divisional Report',
          status: 'active',
          division: 'Mezam',
          content: 'Mezam Division comprehensive performance report: Infrastructure - 8 community roads under construction, 1 completed; Education - 3 school projects 85% complete, intelligent classrooms initiative progressing; Health - Malaria prevention campaign reached 12,000 residents with 90% vaccination coverage; Community - 2 peace-building forums conducted. Digital Entrepreneurship Hub at Phase 2 with NOEDIF partnership and UK digital education MOU. Budget utilization: 88% with strong community feedback and support.',
          executionRate: '88%',
          projects: 14,
          highlights: ['Wum Hospital fence contracted', 'Intelligent classrooms (UK partnership)', 'NOEDIF digital fund support', 'Multi-district coordination'],
          pdiPhase2: 'Phase 2 completed with 3.4B FCFA allocation',
        },
        {
          id: 'div-2',
          title: 'Momo Division Report - March 2026 Session',
          date: '2026-05-28',
          type: 'Divisional Report',
          status: 'active',
          division: 'Momo',
          content: 'Momo Division focus on education and youth development: GHS Classroom Blocks 100% complete, ready for 1,200 student enrollment in September 2026. Vocational skills training 95% complete with 450 youth trained in various trades. Agricultural cooperative support extending to 200 farmers with equipment and training. Nutrition programs active in 15 schools with maternal and child health focus. All 5 subdivisions represented equally for first time. Budget utilization: 92%.',
          executionRate: '92%',
          projects: 16,
          highlights: ['GHS Classroom Blocks 100% complete', '450 youth vocational trained', '200 farmers equipped', '15 schools nutrition programs', 'First time all subdivisions included'],
          pdiPhase2: 'Under investigation for optimization; 2,100 youth employment target',
        },
        {
          id: 'div-3',
          title: 'Boyo Division Report - March 2026 Session',
          date: '2026-05-28',
          type: 'Divisional Report',
          status: 'active',
          division: 'Boyo',
          content: 'Boyo Division healthcare expansion priority: 2 health centers upgraded with modern equipment and trained staff. 5 water supply projects providing clean water access to 8,000 residents in hitherto underserved areas. Organic farming pilot engaging 100 farmers with sustainable practices training. 4 peace initiatives with strong community participation and traditional leader buy-in. Budget utilization: 85% with focus on health and water infrastructure.',
          executionRate: '85%',
          projects: 12,
          highlights: ['2 health centers upgraded', '8,000 residents with water access', '100 organic farmers trained', '4 peace initiatives active'],
          pdiPhase2: 'Sub-5M FCFA cap per project; diaspora-backed cassava production unit (NADECO)',
        },
        {
          id: 'div-4',
          title: 'Donga-Mantung Division Report - March 2026 Session',
          date: '2026-05-28',
          type: 'Divisional Report',
          status: 'active',
          division: 'Donga-Mantung',
          content: 'Donga-Mantung Division operational challenges and achievements: 8 projects contracted and in various stages. PDI Phase Two employed 418 youths (Nkambe 102, Ndu 60, Ako 72, Misaje 80, Nwa 104) over 21 days. Payment delays on PDI caused tension with protest threats requiring presidential intervention. Project quality concerns flagged in Ako and Nwa (contractors at 0% with 30% time elapsed). Technical team directed to investigate and relaunch underperforming projects. Budget utilization: 78%.',
          executionRate: '78%',
          projects: 8,
          highlights: ['418 youths employed in PDI', 'Payment verification protocol needed', 'Contractor performance issues', 'Technical team investigation initiated'],
          pdiPhase2: '418 youths employed; payment delays resolved through controls',
          challenges: ['Payment delays', 'Contractor accountability', '0% execution in some sites'],
        },
      ]
    },
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const toggleArchiveSection = (section) => {
    setExpandedArchiveSection(expandedArchiveSection === section ? null : section)
  }

  const downloadDocument = (item, source = 'archive') => {
    if (item.downloadUrl) {
      const link = document.createElement('a')
      link.href = item.downloadUrl
      link.download = `${item.title}.pdf`
      link.click()
    }
  }

  const renderGovernanceSection = (sectionKey) => {
    const section = governanceBodies[sectionKey]
    const IconComponent = section.icon
    const isExpanded = expandedSection === sectionKey

    return (
      <div key={sectionKey} className="space-y-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full"
        >
          <Card className={`p-6 cursor-pointer hover:shadow-lg transition ${section.borderColor}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`bg-gradient-to-br ${section.color} p-3 rounded-lg`}>
                  <IconComponent className="w-6 h-6 text-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg text-foreground">{section.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {section.reports.length} reports • Latest: {new Date(section.reports[0].date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge label={`${section.reports.filter(r => r.status === 'active').length} Active`} />
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-accent" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </Card>
        </button>

        {isExpanded && (
          <div className="space-y-3 pl-4">
            {section.reports.map((report) => (
              <Card key={report.id} className="p-5 hover:shadow-md transition border-l-4 border-l-accent/50">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-accent" />
                        <h4 className="font-bold text-foreground">{report.title}</h4>
                        <Badge label={report.type} />
                        {report.status === 'active' && (
                          <Badge label="●" className="bg-green-100 text-green-700" />
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {report.attendees} attendees
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {report.duration}
                        </div>
                        {report.division && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {report.division}
                          </div>
                        )}
                      </div>

                      {report.executionRate && (
                        <div className="text-sm font-semibold text-primary mb-2">
                          Execution Rate: {report.executionRate}
                        </div>
                      )}
                    </div>

                    <button
                      className="p-2 hover:bg-accent/10 rounded-lg transition text-accent"
                      title="AI Summary"
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                  </div>

                  {report.highlights && (
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-primary uppercase tracking-wide">Key Highlights</p>
                          <ul className="text-sm text-foreground mt-1 space-y-1">
                            {report.highlights.map((highlight, i) => (
                              <li key={i}>• {highlight}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {report.keyDecisions && (
                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-accent uppercase tracking-wide">Key Decisions</p>
                          <ul className="text-sm text-foreground mt-1 space-y-1">
                            {report.keyDecisions.map((decision, i) => (
                              <li key={i}>• {decision}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReport?.id === report.id && (
                    <div className="bg-card border rounded-lg p-4 text-sm text-foreground/80 leading-relaxed">
                      {report.content}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                      className="flex-1 px-3 py-2 rounded-lg border border-primary text-primary font-medium hover:bg-primary/10 transition text-sm"
                    >
                      {selectedReport?.id === report.id ? 'Hide Details' : 'View Full Report'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderArchiveSection = (categoryKey) => {
    const category = archiveCategories[categoryKey]
    const IconComponent = category.icon
    const isExpanded = expandedArchiveSection === categoryKey

    return (
      <div key={categoryKey} className="space-y-4">
        <button
          onClick={() => toggleArchiveSection(categoryKey)}
          className="w-full"
        >
          <Card className={`p-6 cursor-pointer hover:shadow-lg transition ${category.borderColor}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`bg-gradient-to-br ${category.color} p-3 rounded-lg`}>
                  <IconComponent className="w-6 h-6 text-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg text-foreground">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.items.length} items stored
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-accent" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </Card>
        </button>

        {isExpanded && (
          <div className="space-y-3 pl-4">
            {category.items.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-md transition border-l-4 border-l-accent/50">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      {item.size && (
                        <p className="text-xs text-muted-foreground mt-1">📦 {item.size}</p>
                      )}
                    </div>
                  </div>

                  {item.date && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                  )}

                  {item.keywords && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {item.keywords.map((keyword) => (
                        <Badge key={keyword} label={keyword} className="text-xs" />
                      ))}
                    </div>
                  )}

                  {item.downloadUrl && (
                    <button
                      onClick={() => downloadDocument(item)}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition text-xs flex items-center gap-1 inline-flex"
                    >
                      <Download className="w-3 h-3" />
                      Download PDF
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="stagger space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Reports"
        description="Governance reports, financial accounts, divisional updates, and development records — signed, dated, and preserved."
      />

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-border pb-4 overflow-x-auto">
        <button
          onClick={() => setExpandedSection('rec')}
          className={`px-4 py-2 font-semibold border-b-2 transition whitespace-nowrap ${
            expandedSection === 'rec'
              ? 'border-accent text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Reports
        </button>
        <button
          onClick={() => setExpandedArchiveSection('reports')}
          className={`px-4 py-2 font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            expandedArchiveSection ? 'border-accent text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Archive className="w-4 h-4" />
          Archives
        </button>
      </div>

      {/* Reports Section */}
      {!expandedArchiveSection && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">REC Sessions</p>
              <p className="text-2xl font-bold text-primary">2</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Finance Reports</p>
              <p className="text-2xl font-bold text-primary">5</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Divisional Reports</p>
              <p className="text-2xl font-bold text-primary">4</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Budget Execution</p>
              <p className="text-2xl font-bold text-accent">97.5%</p>
            </Card>
          </div>

          {renderGovernanceSection('rec')}
          {renderGovernanceSection('fc')}
          {renderGovernanceSection('divisions')}
        </div>
      )}

      {/* Archives Section */}
      {expandedArchiveSection && (
        <div className="space-y-6">
          {Object.keys(archiveCategories).map((categoryKey) =>
            renderArchiveSection(categoryKey)
          )}
        </div>
      )}

      {/* Info Section */}
      <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/5 border border-primary/20">
        <div className="flex items-start gap-4">
          <Database className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Institutional Knowledge Base
            </h3>
            <p className="text-sm text-muted-foreground">
              Complete archive of governance minutes, financial accounts, committee reports, divisional updates, and project bank documents. All records are indexed and downloadable for institutional reference and audit compliance.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
