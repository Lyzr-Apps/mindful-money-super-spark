'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  FaHome,
  FaChartLine,
  FaBullseye,
  FaPlusCircle,
  FaShoppingBag,
  FaUtensils,
  FaGamepad,
  FaCar,
  FaHeart,
  FaLeaf,
  FaTrophy,
  FaCheck,
  FaArrowLeft,
  FaCog
} from 'react-icons/fa'
import { Loader2 } from 'lucide-react'
import { callAIAgent } from '@/lib/aiAgent'

// TypeScript interfaces based on actual agent responses
interface WellnessManagerResponse {
  interaction_type: string
  unified_message: string
  intervention_summary: {
    needed: boolean
    type: string
    key_points: string[]
  }
  mood_support_summary: {
    provided: boolean
    key_technique: string
    emotional_insight: string
  }
  recommended_actions: Array<{
    action: string
    priority: string
    reason: string
  }>
  encouragement: string
}

interface BehavioralInsightsResponse {
  analysis_period: {
    start_date: string
    end_date: string
    total_transactions: number
  }
  narrative_summary: string
  key_patterns: Array<{
    pattern_type: string
    description: string
    frequency: string
    impact: string
  }>
  impulse_analysis: {
    top_impulse_categories: string[]
    common_triggers: string[]
    impulse_percentage: number
  }
  emotional_insights: {
    most_common_spending_emotions: string[]
    emotion_spending_correlation: string
    stress_spending_score: number
  }
  time_based_habits: {
    high_risk_times: string[]
    mindful_spending_times: string[]
    patterns_detected: string[]
  }
  progress_highlights: Array<{
    achievement: string
    impact: string
    encouragement: string
  }>
  growth_strategies: Array<{
    strategy: string
    why_it_works: string
    how_to_implement: string
    priority: string
  }>
  next_month_focus: string
}

interface Expense {
  id: string
  amount: number
  category: string
  mood?: string
  timestamp: Date
  description?: string
}

interface Budget {
  category: string
  limit: number
  spent: number
}

interface Goal {
  id: string
  name: string
  target: number
  current: number
  deadline: string
  icon: string
}

interface Challenge {
  id: string
  title: string
  description: string
  progress: number
  total: number
}

type Screen = 'dashboard' | 'track' | 'insights' | 'goals' | 'settings'
type Mood = 'happy' | 'neutral' | 'stressed' | 'anxious' | 'sad'

const AGENT_IDS = {
  wellnessManager: '698585db1caa4e686dd66da3',
  behavioralInsights: '69858608e17e33c11eed199a'
}

const CATEGORIES = [
  { id: 'food', name: 'Food', icon: FaUtensils, color: 'from-green-400 to-green-600' },
  { id: 'travel', name: 'Travel', icon: FaCar, color: 'from-blue-400 to-blue-600' },
  { id: 'shopping', name: 'Shopping', icon: FaShoppingBag, color: 'from-purple-400 to-purple-600' },
  { id: 'entertainment', name: 'Entertainment', icon: FaGamepad, color: 'from-pink-400 to-pink-600' }
]

const MOODS: Array<{ id: Mood; emoji: string; label: string }> = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'stressed', emoji: '😰', label: 'Stressed' },
  { id: 'anxious', emoji: '😟', label: 'Anxious' },
  { id: 'sad', emoji: '😢', label: 'Sad' }
]

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [budgets, setBudgets] = useState<Budget[]>([
    { category: 'food', limit: 300, spent: 180 },
    { category: 'travel', limit: 250, spent: 120 },
    { category: 'shopping', limit: 200, spent: 150 },
    { category: 'entertainment', limit: 150, spent: 85 }
  ])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', name: 'Emergency Fund', target: 5000, current: 1200, deadline: '2026-12-31', icon: 'shield' },
    { id: '2', name: 'Vacation', target: 2000, current: 450, deadline: '2026-08-01', icon: 'plane' }
  ])
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: '1', title: 'No-Spend Weekday', description: 'Go 5 weekdays without non-essential purchases', progress: 3, total: 5 },
    { id: '2', title: 'Mindful Breathing', description: 'Practice breathing before purchases 3 times', progress: 1, total: 3 }
  ])

  // Track screen state
  const [amount, setAmount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [includeMoodCheck, setIncludeMoodCheck] = useState(false)
  const [loading, setLoading] = useState(false)
  const [managerResponse, setManagerResponse] = useState<WellnessManagerResponse | null>(null)
  const [showBreathingAnimation, setShowBreathingAnimation] = useState(false)

  // Insights screen state
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsData, setInsightsData] = useState<BehavioralInsightsResponse | null>(null)

  // Settings state
  const [tone, setTone] = useState<'gentle' | 'motivational' | 'direct'>('gentle')

  const handleLogExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    setLoading(true)
    const category = CATEGORIES[selectedCategory]
    const expenseAmount = parseFloat(amount)

    // Create expense record
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: expenseAmount,
      category: category.id,
      mood: selectedMood || undefined,
      timestamp: new Date()
    }

    // Update budgets
    const updatedBudgets = budgets.map(b =>
      b.category === category.id
        ? { ...b, spent: b.spent + expenseAmount }
        : b
    )
    setBudgets(updatedBudgets)
    setExpenses([newExpense, ...expenses])

    // Build message for wellness manager
    const budget = updatedBudgets.find(b => b.category === category.id)
    let message = `I just spent $${expenseAmount} on ${category.name}`
    if (budget) {
      message += ` and my budget limit is $${budget.limit} for the month.`
    }
    if (includeMoodCheck && selectedMood) {
      message += ` I'm feeling ${selectedMood}.`
    }

    try {
      const result = await callAIAgent(message, AGENT_IDS.wellnessManager)
      if (result.success && result.response.status === 'success') {
        setManagerResponse(result.response.result as WellnessManagerResponse)

        // Show breathing animation if intervention needed
        if (result.response.result.intervention_summary?.needed) {
          setShowBreathingAnimation(true)
        }
      }
    } catch (error) {
      console.error('Error calling wellness manager:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewInsights = async () => {
    setInsightsLoading(true)

    // Build insights message from current data
    const last30Days = expenses.filter(e => {
      const daysDiff = (Date.now() - e.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff <= 30
    })

    const budgetSummary = budgets.map(b =>
      `${b.category.charAt(0).toUpperCase() + b.category.slice(1)}: $${b.spent} (limit $${b.limit})`
    ).join(', ')

    const message = `Analyze spending patterns: Last 30 days - ${budgetSummary}. Total transactions: ${last30Days.length}.`

    try {
      const result = await callAIAgent(message, AGENT_IDS.behavioralInsights)
      if (result.success && result.response.status === 'success') {
        setInsightsData(result.response.result as BehavioralInsightsResponse)
      }
    } catch (error) {
      console.error('Error getting insights:', error)
    } finally {
      setInsightsLoading(false)
    }
  }

  const clearExpenseForm = () => {
    setAmount('')
    setSelectedMood(null)
    setIncludeMoodCheck(false)
    setManagerResponse(null)
    setShowBreathingAnimation(false)
  }

  const getTotalSpent = () => budgets.reduce((sum, b) => sum + b.spent, 0)
  const getTotalLimit = () => budgets.reduce((sum, b) => sum + b.limit, 0)
  const getOverallHealth = () => {
    const totalSpent = getTotalSpent()
    const totalLimit = getTotalLimit()
    return ((totalLimit - totalSpent) / totalLimit) * 100
  }

  // Components
  const ProgressRing = ({ percentage, size = 120, strokeWidth = 10, color = 'rgb(134, 239, 172)' }: { percentage: number; size?: number; strokeWidth?: number; color?: string }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(229, 231, 235)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute text-2xl font-bold text-gray-800">
          {Math.round(percentage)}%
        </div>
      </div>
    )
  }

  const BreathingAnimation = () => {
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale')
    const [count, setCount] = useState(4)

    useEffect(() => {
      const timer = setInterval(() => {
        setCount(prev => {
          if (prev > 1) return prev - 1

          setPhase(current => {
            if (current === 'inhale') return 'hold'
            if (current === 'hold') return 'exhale'
            if (current === 'exhale') return 'pause'
            return 'inhale'
          })
          return 4
        })
      }, 1000)

      return () => clearInterval(timer)
    }, [])

    const getMessage = () => {
      switch (phase) {
        case 'inhale': return 'Breathe in...'
        case 'hold': return 'Hold...'
        case 'exhale': return 'Breathe out...'
        case 'pause': return 'Pause...'
      }
    }

    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-green-300 to-blue-300 transition-all duration-1000 ${
          phase === 'inhale' ? 'scale-125' : phase === 'exhale' ? 'scale-75' : 'scale-100'
        }`} />
        <p className="text-xl font-medium text-gray-700">{getMessage()}</p>
        <p className="text-4xl font-bold text-gray-800">{count}</p>
        <Button
          variant="outline"
          onClick={() => setShowBreathingAnimation(false)}
          className="mt-4"
        >
          Close
        </Button>
      </div>
    )
  }

  // Screen Components
  const DashboardScreen = () => (
    <div className="space-y-6 pb-24">
      {/* Daily Encouragement */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <FaLeaf className="text-green-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Good morning!</h3>
              <p className="text-gray-700 leading-relaxed">
                You're showing wonderful awareness with your spending journey. Every mindful choice you make strengthens both your financial and emotional wellbeing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spending Health Ring */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-800">Spending Health</CardTitle>
          <CardDescription className="text-gray-600">Overall budget status this month</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <ProgressRing
            percentage={getOverallHealth()}
            size={160}
            strokeWidth={12}
            color="rgb(134, 239, 172)"
          />
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ${getTotalSpent().toFixed(2)} spent of ${getTotalLimit().toFixed(2)}
            </p>
          </div>

          {/* Category Breakdown */}
          <div className="w-full space-y-3 mt-4">
            {budgets.map((budget) => {
              const category = CATEGORIES.find(c => c.id === budget.category)
              const percentage = (budget.spent / budget.limit) * 100
              return (
                <div key={budget.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      {category && <category.icon className="text-gray-600" />}
                      <span className="font-medium text-gray-800">{category?.name}</span>
                    </div>
                    <span className="text-gray-600">${budget.spent} / ${budget.limit}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${category?.color} transition-all duration-500`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Log Expense Button */}
      <Button
        className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg font-semibold shadow-lg"
        onClick={() => setCurrentScreen('track')}
      >
        <FaPlusCircle className="mr-2" />
        Log Expense
      </Button>

      {/* Active Challenges */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center">
            <FaTrophy className="mr-2 text-yellow-500" />
            Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenges.map(challenge => (
            <div key={challenge.id} className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-800">{challenge.title}</p>
                  <p className="text-sm text-gray-600">{challenge.description}</p>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {challenge.progress}/{challenge.total}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                  style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  const TrackScreen = () => (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Log Expense</h2>
      </div>

      {!managerResponse ? (
        <Card className="shadow-lg">
          <CardContent className="pt-6 space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-gray-500">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-3xl font-bold h-16 pl-10 border-2 focus:border-green-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Category Slider */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <div className="grid grid-cols-4 gap-3">
                {CATEGORIES.map((category, index) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(index)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                      selectedCategory === index
                        ? `bg-gradient-to-br ${category.color} text-white shadow-lg scale-105`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <category.icon className="text-2xl mb-2" />
                    <span className="text-xs font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Check-in Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Add mood check-in?</label>
                <button
                  onClick={() => setIncludeMoodCheck(!includeMoodCheck)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    includeMoodCheck
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {includeMoodCheck ? 'Yes' : 'No'}
                </button>
              </div>

              {includeMoodCheck && (
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {MOODS.map(mood => (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                        selectedMood === mood.id
                          ? 'bg-blue-100 ring-2 ring-blue-500 scale-105'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-3xl mb-1">{mood.emoji}</span>
                      <span className="text-xs font-medium text-gray-700">{mood.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleLogExpense}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Log Expense'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Manager Response */}
          {showBreathingAnimation ? (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <BreathingAnimation />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-none shadow-lg">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start space-x-3">
                    <FaHeart className="text-green-600 text-2xl mt-1 flex-shrink-0" />
                    <div className="space-y-3">
                      <p className="text-gray-800 leading-relaxed">{managerResponse.unified_message}</p>

                      {managerResponse.intervention_summary?.needed && (
                        <div className="bg-white/60 rounded-lg p-4 space-y-2">
                          <p className="font-semibold text-gray-800 text-sm">Budget Status:</p>
                          {managerResponse.intervention_summary.key_points.map((point, idx) => (
                            <p key={idx} className="text-sm text-gray-700">• {point}</p>
                          ))}
                        </div>
                      )}

                      {managerResponse.mood_support_summary?.provided && (
                        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                          <p className="font-semibold text-gray-800 text-sm">Emotional Support:</p>
                          <p className="text-sm text-gray-700">{managerResponse.mood_support_summary.emotional_insight}</p>
                          <p className="text-sm text-blue-700 font-medium">Try: {managerResponse.mood_support_summary.key_technique}</p>
                          {managerResponse.intervention_summary?.needed && (
                            <Button
                              variant="outline"
                              onClick={() => setShowBreathingAnimation(true)}
                              className="mt-2 text-blue-700 border-blue-300 hover:bg-blue-100"
                            >
                              Start Breathing Exercise
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Actions */}
              {managerResponse.recommended_actions && managerResponse.recommended_actions.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-800 text-lg">Recommended Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {managerResponse.recommended_actions.map((action, idx) => (
                      <div key={idx} className={`p-4 rounded-lg ${
                        action.priority === 'high' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-gray-800">{action.action}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            action.priority === 'high'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {action.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{action.reason}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Encouragement */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-lg">
                <CardContent className="pt-6">
                  <p className="text-gray-700 leading-relaxed italic">"{managerResponse.encouragement}"</p>
                </CardContent>
              </Card>

              <Button
                onClick={clearExpenseForm}
                variant="outline"
                className="w-full"
              >
                Log Another Expense
              </Button>
            </>
          )}
        </>
      )}

      {/* Transaction History */}
      {expenses.length > 0 && !managerResponse && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-800">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenses.slice(0, 5).map(expense => {
              const category = CATEGORIES.find(c => c.id === expense.category)
              return (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {category && <category.icon className="text-gray-600" />}
                    <div>
                      <p className="font-medium text-gray-800">{category?.name}</p>
                      <p className="text-xs text-gray-500">
                        {expense.timestamp.toLocaleDateString()} {expense.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">${expense.amount.toFixed(2)}</p>
                    {expense.mood && (
                      <p className="text-xs text-gray-500">{MOODS.find(m => m.id === expense.mood)?.emoji}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )

  const InsightsScreen = () => (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Insights</h2>
      </div>

      {!insightsData ? (
        <>
          {/* Monthly Overview Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <FaChartLine className="text-purple-600 text-2xl mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Journey This Month</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Discover patterns in your spending and emotional habits. Understanding your unique triggers helps you build mindful financial wellness.
                  </p>
                  <Button
                    onClick={handleViewInsights}
                    disabled={insightsLoading}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  >
                    {insightsLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      'View Full Insights'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-lg">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-gray-800">{expenses.length}</p>
                <p className="text-sm text-gray-600 mt-1">Transactions</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-gray-800">{budgets.filter(b => b.spent <= b.limit).length}</p>
                <p className="text-sm text-gray-600 mt-1">On Track</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Narrative Summary */}
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <FaLeaf className="text-green-600 text-2xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Monthly Story</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{insightsData.narrative_summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Patterns */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-800">Pattern Discovery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insightsData.key_patterns.map((pattern, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-gray-800 capitalize">{pattern.pattern_type.replace('_', ' ')}</p>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{pattern.description}</p>
                  <p className="text-xs text-gray-600"><strong>Impact:</strong> {pattern.impact}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Emotional Insights */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center">
                <FaHeart className="mr-2 text-pink-500" />
                Emotional Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-pink-50 rounded-lg">
                <p className="text-sm font-medium text-gray-800 mb-2">Common Emotions</p>
                <div className="flex flex-wrap gap-2">
                  {insightsData.emotional_insights.most_common_spending_emotions.map((emotion, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{insightsData.emotional_insights.emotion_spending_correlation}</p>
            </CardContent>
          </Card>

          {/* Growth Strategies */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-800">Growth Strategies</CardTitle>
              <CardDescription className="text-gray-600">Science-backed techniques for mindful spending</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insightsData.growth_strategies.map((strategy, idx) => (
                <div key={idx} className={`p-4 rounded-lg ${
                  strategy.priority === 'high' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-gray-800">{strategy.strategy}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      strategy.priority === 'high'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {strategy.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2"><strong>Why it works:</strong> {strategy.why_it_works}</p>
                  <p className="text-sm text-gray-600"><strong>How to start:</strong> {strategy.how_to_implement}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Progress Highlights */}
          {insightsData.progress_highlights.length > 0 && (
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <FaTrophy className="mr-2 text-yellow-600" />
                  Celebrate Your Wins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insightsData.progress_highlights.map((highlight, idx) => (
                  <div key={idx} className="p-4 bg-white/60 rounded-lg">
                    <p className="font-semibold text-gray-800 mb-1">{highlight.achievement}</p>
                    <p className="text-sm text-gray-700 mb-2">{highlight.impact}</p>
                    <p className="text-sm text-green-700 italic">{highlight.encouragement}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => setInsightsData(null)}
            variant="outline"
            className="w-full"
          >
            <FaArrowLeft className="mr-2" />
            Back to Overview
          </Button>
        </>
      )}
    </div>
  )

  const GoalsScreen = () => (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Goals & Savings</h2>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        {goals.map(goal => {
          const percentage = (goal.current / goal.target) * 100
          return (
            <Card key={goal.id} className="shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{goal.name}</h3>
                    <p className="text-sm text-gray-600">Target: ${goal.target.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Deadline: {new Date(goal.deadline).toLocaleDateString()}</p>
                  </div>
                  <ProgressRing
                    percentage={percentage}
                    size={80}
                    strokeWidth={8}
                    color="rgb(168, 85, 247)"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-800">${goal.current.toLocaleString()} saved</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-right">${(goal.target - goal.current).toLocaleString()} to go</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Micro Challenges */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center">
            <FaTrophy className="mr-2 text-yellow-500" />
            Micro Challenges
          </CardTitle>
          <CardDescription className="text-gray-600">Small wins lead to big changes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenges.map(challenge => {
            const isComplete = challenge.progress >= challenge.total
            return (
              <div key={challenge.id} className={`p-4 rounded-lg ${
                isComplete ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{challenge.title}</p>
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                  </div>
                  {isComplete && <FaCheck className="text-green-600 text-xl" />}
                </div>
                <div className="flex items-center space-x-3 mt-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                      style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {challenge.progress}/{challenge.total}
                  </span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Create Goal Button */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
        <CardContent className="pt-6 text-center">
          <FaBullseye className="text-4xl text-purple-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Create New Goal</h3>
          <p className="text-sm text-gray-600">Set a savings target and watch your progress grow</p>
        </CardContent>
      </Card>
    </div>
  )

  const SettingsScreen = () => (
    <div className="space-y-6 pb-24">
      <div className="flex items-center space-x-3 mb-4">
        <button onClick={() => setCurrentScreen('dashboard')} className="text-gray-600 hover:text-gray-800">
          <FaArrowLeft className="text-xl" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      </div>

      {/* Category Limits */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-800">Category Limits</CardTitle>
          <CardDescription className="text-gray-600">Adjust your monthly budget limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {budgets.map(budget => {
            const category = CATEGORIES.find(c => c.id === budget.category)
            return (
              <div key={budget.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {category && <category.icon className="text-gray-600" />}
                    <span className="font-medium text-gray-800">{category?.name}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">${budget.limit}</span>
                </div>
                <Slider
                  value={[budget.limit]}
                  onValueChange={(value) => {
                    setBudgets(budgets.map(b =>
                      b.category === budget.category ? { ...b, limit: value[0] } : b
                    ))
                  }}
                  min={50}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Tone Preference */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-800">Tone Preference</CardTitle>
          <CardDescription className="text-gray-600">How would you like guidance delivered?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(['gentle', 'motivational', 'direct'] as const).map(option => (
            <button
              key={option}
              onClick={() => setTone(option)}
              className={`w-full p-4 rounded-lg text-left transition-all ${
                tone === option
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <p className="font-semibold text-gray-800 capitalize">{option}</p>
              <p className="text-sm text-gray-600">
                {option === 'gentle' && 'Soft, compassionate, understanding'}
                {option === 'motivational' && 'Encouraging, energizing, positive'}
                {option === 'direct' && 'Clear, straightforward, factual'}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-800">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            'Budget alerts when reaching 75%',
            'Daily mindfulness reminders',
            'Weekly insights summary',
            'Goal milestone celebrations'
          ].map((option, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{option}</span>
              <div className="w-12 h-6 bg-green-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  // Bottom Navigation
  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {[
            { id: 'dashboard' as Screen, icon: FaHome, label: 'Home' },
            { id: 'track' as Screen, icon: FaPlusCircle, label: 'Track' },
            { id: 'insights' as Screen, icon: FaChartLine, label: 'Insights' },
            { id: 'goals' as Screen, icon: FaBullseye, label: 'Goals' }
          ].map(nav => (
            <button
              key={nav.id}
              onClick={() => setCurrentScreen(nav.id)}
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all ${
                currentScreen === nav.id
                  ? 'text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <nav.icon className={`text-2xl ${currentScreen === nav.id ? 'scale-110' : ''}`} />
              <span className={`text-xs font-medium ${currentScreen === nav.id ? 'font-semibold' : ''}`}>
                {nav.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              MindfulMoney
            </h1>
            <p className="text-sm text-gray-600">Your compassionate spending companion</p>
          </div>
          <button
            onClick={() => setCurrentScreen('settings')}
            className="p-3 rounded-full hover:bg-white/50 transition-colors"
          >
            <FaCog className="text-xl text-gray-600" />
          </button>
        </div>

        {/* Screen Router */}
        {currentScreen === 'dashboard' && <DashboardScreen />}
        {currentScreen === 'track' && <TrackScreen />}
        {currentScreen === 'insights' && <InsightsScreen />}
        {currentScreen === 'goals' && <GoalsScreen />}
        {currentScreen === 'settings' && <SettingsScreen />}
      </div>

      {/* Bottom Navigation */}
      {currentScreen !== 'settings' && <BottomNav />}
    </div>
  )
}
