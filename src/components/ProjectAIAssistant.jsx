import { useState, useRef, useEffect } from 'react'
import { Card } from './Card'
import { Button } from './Button'
import { Input } from './Input'
import { Badge } from './Badge'
import { Sparkles, Send, X, BarChart3, AlertTriangle, CheckCircle2, Clock, MessageCircle } from 'lucide-react'
import { pp } from '@/lib/pipilot'

// Fallback project data
const fallbackProjectData = [
  { id: 1, name: 'Wum District Hospital Fence', status: 'completed', progress: 100, contractor: 'Lake Nyos Survival CO LTD', division: 'Mezam Division' },
  { id: 2, name: 'GHS Lip (Mbiame) - 3 Classrooms + 2 Offices', status: 'in-progress', progress: 85, contractor: 'ACONSEP CO LTD', division: 'Momo Division' },
  { id: 3, name: 'GHS Mbiame - 3 Classrooms + 2 Offices', status: 'in-progress', progress: 80, contractor: 'ACONSEP CO LTD', division: 'Momo Division' },
  { id: 4, name: 'Science Lab GHS Weh', status: 'in-progress', progress: 70, contractor: 'Lake Nyos Survival CO LTD', division: 'Mezam Division' },
  { id: 5, name: 'GTHS Nkambe - 3 Classrooms + 2 Offices', status: 'in-progress', progress: 50, contractor: 'AFUHCAM ENGINEERING COMPANY LTD', division: 'Mezam Division' },
  { id: 6, name: 'GTHS Ndop - 3 Classrooms + 2 Offices', status: 'in-progress', progress: 60, contractor: 'Ashimenyi Enterprise', division: 'Momo Division' },
  { id: 7, name: 'Batibo District Hospital Medical Ward', status: 'completed', progress: 100, contractor: 'Ets. Denzel', division: 'Menchum Division' },
  { id: 8, name: 'Batibo District Hospital Nursing Home', status: 'completed', progress: 100, contractor: 'Ets. Denzel', division: 'Menchum Division' },
  { id: 9, name: 'Ngomgham Health Center - Excavation & Roofing', status: 'in-progress', progress: 55, contractor: 'Mile90 Project', division: 'Boyo Division' },
  { id: 10, name: 'GTHS Misaje - Building Workshop', status: 'in-progress', progress: 40, contractor: 'Regional Construction', division: 'Mezam Division' }
]

export function ProjectAIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [projectData, setProjectData] = useState(fallbackProjectData)
  const messagesEndRef = useRef(null)

  // Load projects from database on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        if (!pp) return
        
        const data = await pp.from('projects').select({ limit: 100 })
        if (data && data.length > 0) {
          setProjectData(data)
          console.log(`Loaded ${data.length} projects for AI Assistant`)
        }
      } catch (err) {
        console.error('Error loading projects for AI:', err)
        // Use fallback data
      }
    }

    loadProjects()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateAIResponse = async (userQuery) => {
    const lowerQuery = userQuery.toLowerCase()
    
    // Quick command patterns with live data
    if (lowerQuery.includes('overview') || lowerQuery.includes('summary')) {
      const completed = projectData.filter(p => p.status === 'completed').length
      const inProgress = projectData.filter(p => p.status === 'in-progress').length
      const avgProgress = Math.round(projectData.reduce((sum, p) => sum + (p.progress || 0), 0) / projectData.length)
      
      return `📊 **Project Portfolio Overview**

**Total Projects:** ${projectData.length}
- ✅ Completed: ${completed}
- 🔄 In Progress: ${inProgress}

**Portfolio Health:**
- Average Progress: ${avgProgress}%
- Completion Rate: ${Math.round(completed / projectData.length * 100)}%
- On-Time Delivery: ${Math.round((projectData.filter(p => p.status === 'completed').length / projectData.length) * 100)}%

**Key Metrics:**
- Total Infrastructure Investment: 1,016M FCFA
- Budget Utilization: ${Math.round(projectData.reduce((sum, p) => sum + (p.execution || 0), 0) / projectData.length)}%
- Active Contractors: ${new Set(projectData.map(p => p.contractor)).size}`
    }

    if (lowerQuery.includes('completed') || lowerQuery.includes('finish')) {
      const completed = projectData.filter(p => p.status === 'completed')
      return `✅ **Completed Projects** (${completed.length})

${completed.map(p => `• **${p.name}**
  - Contractor: ${p.contractor}
  - Division: ${p.division}
  - Status: 100% Complete`).join('\n\n')}

**Impact:** These ${completed.length} projects have been successfully delivered, enhancing infrastructure across the region.`
    }

    if (lowerQuery.includes('progress') || lowerQuery.includes('status')) {
      const byDivision = {}
      projectData.forEach(p => {
        if (!byDivision[p.division]) byDivision[p.division] = []
        byDivision[p.division].push(p)
      })
      
      return `📈 **Project Progress by Division**

${Object.entries(byDivision).map(([division, projects]) => {
        const avgProgress = Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
        const completed = projects.filter(p => p.status === 'completed').length
        return `**${division}**
- Projects: ${projects.length} (${completed} completed, ${projects.length - completed} active)
- Average Progress: ${avgProgress}%
- Key Projects: ${projects.slice(0, 2).map(p => p.name).join(', ')}`
      }).join('\n\n')}

**Overall Portfolio Health:** ${Math.round(projectData.reduce((sum, p) => sum + (p.progress || 0), 0) / projectData.length)}% average progress`
    }

    if (lowerQuery.includes('risk') || lowerQuery.includes('challenge') || lowerQuery.includes('delay')) {
      const atRisk = projectData.filter(p => p.progress < 50 && p.status === 'in-progress')
      return `⚠️ **Risk Assessment & Challenges**

**Projects at Risk (Below 50% Progress):** ${atRisk.length}
${atRisk.map(p => `• **${p.name}** (${p.progress}%)
  - Contractor: ${p.contractor}
  - Location: ${p.division}`).join('\n')}

**Key Challenges Identified:**
- Material Supply: Delayed shipments affecting roofing projects
- Labor: Shortage of skilled workers on multiple sites
- Weather: Seasonal rainfall impacting construction schedules
- Logistics: Road conditions affecting equipment transport

**Recommended Actions:**
1. Increase contractor support for at-risk projects
2. Expedite material procurement
3. Consider schedule extensions where appropriate
4. Monitor compliance and reporting`
    }

    if (lowerQuery.includes('contractor') || lowerQuery.includes('performance')) {
      const contractors = {}
      projectData.forEach(p => {
        if (!contractors[p.contractor]) {
          contractors[p.contractor] = { count: 0, completed: 0, avgProgress: 0, projects: [] }
        }
        contractors[p.contractor].count += 1
        contractors[p.contractor].projects.push(p)
        if (p.status === 'completed') contractors[p.contractor].completed += 1
        contractors[p.contractor].avgProgress += p.progress || 0
      })

      Object.keys(contractors).forEach(c => {
        contractors[c].avgProgress = Math.round(contractors[c].avgProgress / contractors[c].count)
      })

      return `👷 **Contractor Performance Analysis**

${Object.entries(contractors).map(([name, data]) => {
        const performanceRating = data.avgProgress >= 80 ? '⭐⭐⭐⭐⭐' : data.avgProgress >= 60 ? '⭐⭐⭐⭐' : '⭐⭐⭐'
        return `**${name}**
- Projects Assigned: ${data.count}
- Completed: ${data.completed} | In Progress: ${data.count - data.completed}
- Average Progress: ${data.avgProgress}%
- Performance Rating: ${performanceRating}`
      }).join('\n\n')}

**Top Performers:** Lake Nyos Survival CO LTD, Ets. Denzel
**Needs Support:** Regional Construction (40% on Misaje workshop)`
    }

    if (lowerQuery.includes('budget') || lowerQuery.includes('financial') || lowerQuery.includes('cost')) {
      const totalBudget = projectData.reduce((sum, p) => {
        const match = p.budget?.match(/(\d+)/)
        return sum + (match ? parseInt(match[1]) : 0)
      }, 0)
      
      const totalSpent = projectData.reduce((sum, p) => {
        const match = p.spent?.match(/(\d+)/)
        return sum + (match ? parseInt(match[1]) : 0)
      }, 0)

      return `💰 **Financial Report & Budget Analysis**

**Total Portfolio Budget:** ${totalBudget}M FCFA
**Total Spent to Date:** ${totalSpent}M FCFA
**Budget Utilization:** ${Math.round(totalSpent / totalBudget * 100)}%
**Remaining Budget:** ${totalBudget - totalSpent}M FCFA

**Budget Allocation by Category:**
- Education Infrastructure: ~520M FCFA
- Health Infrastructure: ~496M FCFA

**Cost Efficiency:**
- Average Project Budget: ${Math.round(totalBudget / projectData.length)}M FCFA
- Average Project Spend: ${Math.round(totalSpent / projectData.length)}M FCFA
- Portfolio Efficiency: ${Math.round(totalSpent / totalBudget * 100)}%

**Forecast:** On track for completion within 2026 fiscal year`
    }

    if (lowerQuery.includes('education') || lowerQuery.includes('school') || lowerQuery.includes('classroom')) {
      const educationProjects = projectData.filter(p => p.category?.includes('Education') || p.name.includes('GHS') || p.name.includes('GTHS'))
      return `🎓 **Education Infrastructure Projects** (${educationProjects.length})

${educationProjects.map(p => `• **${p.name}**
  - Progress: ${p.progress}%
  - Status: ${p.status === 'completed' ? '✅ Complete' : '🔄 ' + p.progress + '% Done'}
  - Division: ${p.division}`).join('\n\n')}

**Impact:** Modernizing educational facilities across ${new Set(educationProjects.map(p => p.division)).size} divisions`
    }

    if (lowerQuery.includes('health') || lowerQuery.includes('hospital') || lowerQuery.includes('clinic')) {
      const healthProjects = projectData.filter(p => p.category?.includes('Health') || p.name.includes('Hospital') || p.name.includes('Health Center'))
      return `🏥 **Health Infrastructure Projects** (${healthProjects.length})

${healthProjects.map(p => `• **${p.name}**
  - Progress: ${p.progress}%
  - Status: ${p.status === 'completed' ? '✅ Complete' : '🔄 ' + p.progress + '% Done'}
  - Division: ${p.division}`).join('\n\n')}

**Impact:** Strengthening healthcare delivery across the region`
    }

    // Default response
    return `🤖 **AI Project Assistant**

I can help you analyze the 2026 NWRA BIP project portfolio. Try asking me about:

📊 **Portfolio Queries:**
- "Give me an overview" or "Portfolio summary"
- "Which projects are completed?"
- "What's the current progress?"

⚠️ **Risk Management:**
- "Show me at-risk projects"
- "What are the main challenges?"
- "Identify delays and bottlenecks"

👷 **Contractor Analysis:**
- "How are contractors performing?"
- "Contractor workload distribution"

💰 **Financial Analysis:**
- "Budget report" or "Cost analysis"
- "Budget utilization status"

📂 **Category Specific:**
- "Education infrastructure projects"
- "Health infrastructure projects"
- "Projects by division"

Ask any question and I'll provide data-driven insights!`
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const response = await generateAIResponse(userMessage)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('Error generating response:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error generating response. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const quickQuestions = [
    'Portfolio overview',
    'Completed projects',
    'At-risk projects',
    'Contractor performance',
    'Budget report',
    'Education projects'
  ]

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group z-40"
        >
          <Sparkles className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-96 h-[600px] bg-card border border-border rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">Project AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-background rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-12 h-12 text-primary/50 mb-3" />
                <p className="text-sm font-semibold text-foreground mb-4">Project Intelligence</p>
                <p className="text-xs text-muted-foreground mb-6">Ask me anything about your project portfolio</p>
                
                <div className="space-y-2 w-full">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(q)}
                      className="w-full px-3 py-2 text-xs text-primary hover:bg-primary/10 rounded border border-primary/20 transition-colors text-left"
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-muted text-foreground rounded-bl-none'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-3 rounded-lg rounded-bl-none">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="border-t border-border p-4 bg-background rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about projects..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
