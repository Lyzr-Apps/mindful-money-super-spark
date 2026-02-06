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
  FaCog,
  FaStar,
  FaFire,
  FaRocket,
  FaGem,
  FaMedal,
  FaSmile,
  FaMeh,
  FaFrown,
  FaSadTear,
  FaGrin
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

interface Badge {
  id: string
  name: string
  icon: any
  color: string
  unlocked: boolean
  description: string
}

type Screen = 'dashboard' | 'track' | 'insights' | 'goals' | 'settings'
type Mood = 'happy' | 'neutral' | 'stressed' | 'anxious' | 'sad'

const AGENT_IDS = {
  wellnessManager: '698585db1caa4e686dd66da3',
  behavioralInsights: '69858608e17e33c11eed199a'
}

const CATEGORIES = [
  { id: 'food', name: 'Food', icon: FaUtensils, gradient: 'from-emerald-400 via-teal-500 to-cyan-500' },
  { id: 'travel', name: 'Travel', icon: FaCar, gradient: 'from-sky-400 via-blue-500 to-indigo-500' },
  { id: 'shopping', name: 'Shopping', icon: FaShoppingBag, gradient: 'from-purple-400 via-violet-500 to-fuchsia-500' },
  { id: 'entertainment', name: 'Fun', icon: FaGamepad, gradient: 'from-pink-400 via-rose-500 to-red-500' }
]

const MOODS: Array<{ id: Mood; icon: any; label: string; color: string }> = [
  { id: 'happy', icon: FaGrin, label: 'Happy', color: 'text-yellow-500' },
  { id: 'neutral', icon: FaMeh, label: 'Neutral', color: 'text-gray-500' },
  { id: 'stressed', icon: FaFrown, label: 'Stressed', color: 'text-orange-500' },
  { id: 'anxious', icon: FaSadTear, label: 'Anxious', color: 'text-red-500' },
  { id: 'sad', icon: FaSadTear, label: 'Sad', color: 'text-blue-500' }
]

const BADGES: Badge[] = [
  { id: '1', name: 'First Steps', icon: FaStar, color: 'from-yellow-400 to-orange-500', unlocked: true, description: 'Logged your first expense' },
  { id: '2', name: 'Week Warrior', icon: FaFire, color: 'from-orange-400 to-red-500', unlocked: false, description: '7 days of tracking' },
  { id: '3', name: 'Budget Boss', icon: FaGem, color: 'from-purple-400 to-pink-500', unlocked: false, description: 'Stayed within budget for a month' },
  { id: '4', name: 'Savings Star', icon: FaRocket, color: 'from-blue-400 to-cyan-500', unlocked: false, description: 'Reached your first savings goal' }
]

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [budgets, setBudgets] = useState<Budget[]>([
    { category: 'food', limit: 15000, spent: 8500 },
    { category: 'travel', limit: 12000, spent: 6200 },
    { category: 'shopping', limit: 10000, spent: 7500 },
    { category: 'entertainment', limit: 8000, spent: 4200 }
  ])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', name: 'Emergency Fund', target: 250000, current: 60000, deadline: '2026-12-31', icon: 'shield' },
    { id: '2', name: 'Dream Trip', target: 100000, current: 22500, deadline: '2026-08-01', icon: 'plane' }
  ])
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: '1', title: 'No-Spend Weekday', description: 'Skip non-essential buys for 5 weekdays', progress: 3, total: 5 },
    { id: '2', title: 'Mindful Pause', description: 'Take 3 deep breaths before buying', progress: 1, total: 3 }
  ])
  const [streak, setStreak] = useState(5)
  const [badges, setBadges] = useState<Badge[]>(BADGES)
  const [showCelebration, setShowCelebration] = useState(false)

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
  const [colorTheme, setColorTheme] = useState<'dreamy' | 'vibrant' | 'calm'>('dreamy')

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
    let message = `I just spent ₹${expenseAmount} on ${category.name}`
    if (budget) {
      message += ` and my budget limit is ₹${budget.limit} for the month.`
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
      `${b.category.charAt(0).toUpperCase() + b.category.slice(1)}: ₹${b.spent} (limit ₹${b.limit})`
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
  const ProgressRing = ({
    percentage,
    size = 120,
    strokeWidth = 10,
    gradient = 'from-emerald-400 to-teal-500'
  }: {
    percentage: number
    size?: number
    strokeWidth?: number
    gradient?: string
  }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    // Map Tailwind gradient strings to actual color values
    const gradientColorMap: { [key: string]: { start: string; end: string } } = {
      'from-emerald-400 to-teal-500': { start: '#34d399', end: '#14b8a6' },
      'from-purple-400 to-pink-500': { start: '#c084fc', end: '#ec4899' },
      'from-emerald-400 via-teal-500 to-cyan-500': { start: '#34d399', end: '#06b6d4' }
    }

    const colors = gradientColorMap[gradient] || { start: '#34d399', end: '#14b8a6' }
    const gradientId = `gradient-${size}-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: colors.start, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: colors.end, stopOpacity: 1 }} />
            </linearGradient>
          </defs>
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
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute text-2xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
        case 'inhale': return 'breathe in'
        case 'hold': return 'hold it'
        case 'exhale': return 'let it out'
        case 'pause': return 'and pause'
      }
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className={`relative w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-rose-400 transition-all duration-1000 ease-in-out ${
          phase === 'inhale' ? 'scale-125 opacity-90' : phase === 'exhale' ? 'scale-75 opacity-60' : 'scale-100 opacity-80'
        }`}>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent animate-pulse" />
        </div>
        <p className="text-2xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {getMessage()}
        </p>
        <p className="text-5xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {count}
        </p>
        <Button
          onClick={() => setShowBreathingAnimation(false)}
          className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          all good now
        </Button>
      </div>
    )
  }

  const Celebration = () => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 rounded-3xl p-8 shadow-2xl max-w-sm mx-4 animate-bounce-in">
          <div className="text-center space-y-4">
            <FaTrophy className="text-6xl text-yellow-500 mx-auto animate-pulse" />
            <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              you did it!
            </h3>
            <p className="text-gray-700">
              that's another win on your journey
            </p>
            <Button
              onClick={() => setShowCelebration(false)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-8 py-3"
            >
              keep going
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Screen Components
  const DashboardScreen = () => (
    <div className="space-y-6 pb-28">
      {/* Daily Encouragement with Streak */}
      <Card className="bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 border-none shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-3 shadow-lg">
                <FaFire className="text-white text-2xl" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{streak}</p>
                <p className="text-sm text-gray-600">day streak</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {badges.slice(0, 3).map(badge => (
                <div
                  key={badge.id}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    badge.unlocked
                      ? `bg-gradient-to-br ${badge.color} shadow-lg`
                      : 'bg-gray-200'
                  }`}
                >
                  <badge.icon className={`text-lg ${badge.unlocked ? 'text-white' : 'text-gray-400'}`} />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              hey there, you're doing great
            </h3>
            <p className="text-gray-700 leading-relaxed">
              every mindful choice counts. you're building something real here – trust the process
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Spending Health Ring */}
      <Card className="shadow-xl rounded-3xl border-none bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 text-xl">spending vibe check</CardTitle>
          <CardDescription className="text-gray-600">how you're doing this month</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="relative">
            <ProgressRing
              percentage={getOverallHealth()}
              size={180}
              strokeWidth={14}
              gradient="from-emerald-400 to-teal-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-600 mt-12">
                  ₹{getTotalSpent().toLocaleString('en-IN')} / ₹{getTotalLimit().toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="w-full space-y-4 mt-4">
            {budgets.map((budget) => {
              const category = CATEGORIES.find(c => c.id === budget.category)
              const percentage = (budget.spent / budget.limit) * 100
              return (
                <div key={budget.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-3">
                      {category && (
                        <div className={`bg-gradient-to-br ${category.gradient} rounded-xl p-2 shadow-md`}>
                          <category.icon className="text-white text-lg" />
                        </div>
                      )}
                      <span className="font-semibold text-gray-800">{category?.name}</span>
                    </div>
                    <span className="text-gray-600 font-medium">
                      ₹{budget.spent.toLocaleString('en-IN')} / ₹{budget.limit.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full bg-gradient-to-r ${category?.gradient} transition-all duration-700 ease-out rounded-full`}
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
      <button
        onClick={() => setCurrentScreen('track')}
        className="w-full h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white text-lg font-bold shadow-2xl rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center space-x-3"
      >
        <FaPlusCircle className="text-2xl" />
        <span>add expense</span>
      </button>

      {/* Active Challenges */}
      <Card className="shadow-xl rounded-3xl border-none bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center space-x-2 text-xl">
            <FaTrophy className="text-yellow-500" />
            <span>challenges</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenges.map(challenge => {
            const percentage = (challenge.progress / challenge.total) * 100
            return (
              <div key={challenge.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{challenge.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                  </div>
                  <span className="text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent ml-3">
                    {challenge.progress}/{challenge.total}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )

  const TrackScreen = () => (
    <div className="space-y-6 pb-28">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          log expense
        </h2>
        <p className="text-gray-600 text-sm mt-1">no judgment, just tracking</p>
      </div>

      {!managerResponse ? (
        <Card className="shadow-xl rounded-3xl border-none bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-6">
            {/* Amount Input */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">how much?</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-3xl text-gray-400 font-bold">₹</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-4xl font-bold h-20 pl-16 border-2 border-gray-200 focus:border-purple-400 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 transition-all duration-300"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Category Slider */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-700">what's it for?</label>
              <div className="grid grid-cols-4 gap-3">
                {CATEGORIES.map((category, index) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(index)}
                    className={`flex flex-col items-center justify-center p-5 rounded-2xl transition-all duration-300 ${
                      selectedCategory === index
                        ? `bg-gradient-to-br ${category.gradient} text-white shadow-2xl scale-110 -translate-y-1`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    <category.icon className="text-3xl mb-2" />
                    <span className="text-xs font-bold">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Check-in Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">how are you feeling?</label>
                <button
                  onClick={() => setIncludeMoodCheck(!includeMoodCheck)}
                  className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${
                    includeMoodCheck
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {includeMoodCheck ? 'yes' : 'skip'}
                </button>
              </div>

              {includeMoodCheck && (
                <div className="grid grid-cols-5 gap-2 pt-2 animate-fade-in">
                  {MOODS.map(mood => (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 ${
                        selectedMood === mood.id
                          ? 'bg-gradient-to-br from-blue-100 to-purple-100 ring-4 ring-purple-400 scale-110 shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100 hover:scale-105'
                      }`}
                    >
                      <mood.icon className={`text-4xl mb-2 ${selectedMood === mood.id ? mood.color : 'text-gray-400'}`} />
                      <span className="text-xs font-bold text-gray-700">{mood.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleLogExpense}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  logging...
                </>
              ) : (
                'log it'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Manager Response */}
          {showBreathingAnimation ? (
            <Card className="shadow-xl rounded-3xl border-none bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <BreathingAnimation />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 border-none shadow-xl rounded-3xl">
                <CardContent className="pt-6 space-y-5">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-full p-3 shadow-lg flex-shrink-0">
                      <FaHeart className="text-white text-2xl" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <p className="text-gray-800 leading-relaxed font-medium">{managerResponse.unified_message}</p>

                      {managerResponse.intervention_summary?.needed && (
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 space-y-2 shadow-md">
                          <p className="font-bold text-gray-800 text-sm">budget check:</p>
                          {managerResponse.intervention_summary.key_points.map((point, idx) => (
                            <p key={idx} className="text-sm text-gray-700 leading-relaxed">• {point}</p>
                          ))}
                        </div>
                      )}

                      {managerResponse.mood_support_summary?.provided && (
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 space-y-3 shadow-md">
                          <p className="font-bold text-gray-800 text-sm">emotional support:</p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {managerResponse.mood_support_summary.emotional_insight}
                          </p>
                          <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            try this: {managerResponse.mood_support_summary.key_technique}
                          </p>
                          {managerResponse.intervention_summary?.needed && (
                            <Button
                              onClick={() => setShowBreathingAnimation(true)}
                              className="mt-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full px-6 py-2 shadow-lg"
                            >
                              start breathing
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
                <Card className="shadow-xl rounded-3xl border-none bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-800 text-lg">next steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {managerResponse.recommended_actions.map((action, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl shadow-md ${
                        action.priority === 'high'
                          ? 'bg-gradient-to-br from-orange-100 to-red-100 border-2 border-orange-300'
                          : 'bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-bold text-gray-800">{action.action}</p>
                          <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                            action.priority === 'high'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {action.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{action.reason}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Encouragement */}
              <Card className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 border-none shadow-xl rounded-3xl">
                <CardContent className="pt-6">
                  <p className="text-gray-700 leading-relaxed italic font-medium text-center">
                    "{managerResponse.encouragement}"
                  </p>
                </CardContent>
              </Card>

              <Button
                onClick={clearExpenseForm}
                className="w-full h-12 bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50 rounded-2xl font-bold transition-all duration-300"
              >
                log another
              </Button>
            </>
          )}
        </>
      )}

      {/* Transaction History */}
      {expenses.length > 0 && !managerResponse && (
        <Card className="shadow-xl rounded-3xl border-none bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-gray-800 text-xl">recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenses.slice(0, 5).map(expense => {
              const category = CATEGORIES.find(c => c.id === expense.category)
              const mood = expense.mood ? MOODS.find(m => m.id === expense.mood) : null
              return (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    {category && (
                      <div className={`bg-gradient-to-br ${category.gradient} rounded-xl p-3 shadow-md`}>
                        <category.icon className="text-white text-xl" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-800">{category?.name}</p>
                      <p className="text-xs text-gray-500">
                        {expense.timestamp.toLocaleDateString('en-IN')} • {expense.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">₹{expense.amount.toLocaleString('en-IN')}</p>
                      {mood && (
                        <mood.icon className={`text-sm ${mood.color}`} />
                      )}
                    </div>
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
    <div className="space-y-6 pb-28">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          your insights
        </h2>
        <p className="text-gray-600 text-sm mt-1">patterns & progress</p>
      </div>

      {!insightsData ? (
        <>
          {/* Monthly Overview Card */}
          <Card className="bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 border-none shadow-xl rounded-3xl">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-3 shadow-lg flex-shrink-0">
                  <FaChartLine className="text-white text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    discover your patterns
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    understanding your unique spending habits helps you build lasting change. let's see what's going on
                  </p>
                  <Button
                    onClick={handleViewInsights}
                    disabled={insightsLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {insightsLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" />
                        analyzing...
                      </>
                    ) : (
                      'view insights'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-xl rounded-3xl border-none bg-gradient-to-br from-emerald-100 to-teal-100">
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {expenses.length}
                </p>
                <p className="text-sm text-gray-600 mt-2 font-semibold">transactions</p>
              </CardContent>
            </Card>
            <Card className="shadow-xl rounded-3xl border-none bg-gradient-to-br from-purple-100 to-pink-100">
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {budgets.filter(b => b.spent <= b.limit).length}
                </p>
                <p className="text-sm text-gray-600 mt-2 font-semibold">on track</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Narrative Summary */}
          <Card className="bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 border-none shadow-xl rounded-3xl">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full p-3 shadow-lg flex-shrink-0">
                  <FaLeaf className="text-white text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">your monthly story</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{insightsData.narrative_summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Patterns */}
          <Card className="shadow-xl rounded-3xl border-none bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 text-xl">pattern discovery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insightsData.key_patterns.map((pattern, idx) => (
                <div key={idx} className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-md">
                  <p className="font-bold text-gray-800 capitalize mb-2">
                    {pattern.pattern_type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">{pattern.description}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong>impact:</strong> {pattern.impact}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Emotional Insights */}
          <Card className="shadow-xl rounded-3xl border-none bg-gradient-to-br from-pink-100 to-rose-100">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center space-x-2 text-xl">
                <FaHeart className="text-pink-500" />
                <span>emotional patterns</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-5 bg-white/60 backdrop-blur-sm rounded-2xl shadow-md">
                <p className="text-sm font-bold text-gray-800 mb-3">common emotions</p>
                <div className="flex flex-wrap gap-2">
                  {insightsData.emotional_insights.most_common_spending_emotions.map((emotion, idx) => (
                    <span key={idx} className="px-4 py-2 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full text-sm font-bold text-gray-700 shadow-md">
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed px-2">
                {insightsData.emotional_insights.emotion_spending_correlation}
              </p>
            </CardContent>
          </Card>

          {/* Growth Strategies */}
          <Card className="shadow-xl rounded-3xl border-none bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 text-xl">growth strategies</CardTitle>
              <CardDescription className="text-gray-600">science-backed techniques</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insightsData.growth_strategies.map((strategy, idx) => (
                <div key={idx} className={`p-5 rounded-2xl shadow-md ${
                  strategy.priority === 'high'
                    ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-300'
                    : 'bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-bold text-gray-800 flex-1">{strategy.strategy}</p>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      strategy.priority === 'high'
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {strategy.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                    <strong>why it works:</strong> {strategy.why_it_works}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong>how to start:</strong> {strategy.how_to_implement}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Progress Highlights */}
          {insightsData.progress_highlights.length > 0 && (
            <Card className="bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 border-none shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center space-x-2 text-xl">
                  <FaTrophy className="text-yellow-600" />
                  <span>celebrate your wins</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insightsData.progress_highlights.map((highlight, idx) => (
                  <div key={idx} className="p-5 bg-white/70 backdrop-blur-sm rounded-2xl shadow-md">
                    <p className="font-bold text-gray-800 mb-2">{highlight.achievement}</p>
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">{highlight.impact}</p>
                    <p className="text-sm bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent italic font-semibold">
                      {highlight.encouragement}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => setInsightsData(null)}
            className="w-full h-12 bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <FaArrowLeft />
            <span>back</span>
          </Button>
        </>
      )}
    </div>
  )

  const GoalsScreen = () => (
    <div className="space-y-6 pb-28">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          goals & savings
        </h2>
        <p className="text-gray-600 text-sm mt-1">dream big, start small</p>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        {goals.map(goal => {
          const percentage = (goal.current / goal.target) * 100
          return (
            <Card key={goal.id} className="shadow-xl rounded-3xl border-none bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{goal.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      target: ₹{goal.target.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      by {new Date(goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <ProgressRing
                    percentage={percentage}
                    size={90}
                    strokeWidth={9}
                    gradient="from-purple-400 to-pink-500"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-semibold">progress</span>
                    <span className="font-bold text-gray-800">
                      ₹{goal.current.toLocaleString('en-IN')} saved
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-700 ease-out rounded-full"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-right font-semibold">
                    ₹{(goal.target - goal.current).toLocaleString('en-IN')} to go
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Micro Challenges */}
      <Card className="shadow-xl rounded-3xl border-none bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center space-x-2 text-xl">
            <FaTrophy className="text-yellow-500" />
            <span>micro challenges</span>
          </CardTitle>
          <CardDescription className="text-gray-600">small wins, big impact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenges.map(challenge => {
            const isComplete = challenge.progress >= challenge.total
            const percentage = (challenge.progress / challenge.total) * 100
            return (
              <div key={challenge.id} className={`p-5 rounded-2xl shadow-md transition-all duration-300 ${
                isComplete
                  ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-300'
                  : 'bg-white/60 backdrop-blur-sm'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{challenge.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                  </div>
                  {isComplete && (
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full p-2 shadow-lg">
                      <FaCheck className="text-white text-lg" />
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {challenge.progress}/{challenge.total}
                  </span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card className="shadow-xl rounded-3xl border-none bg-gradient-to-br from-purple-100 to-pink-100">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center space-x-2 text-xl">
            <FaMedal className="text-purple-600" />
            <span>achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {badges.map(badge => (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl text-center shadow-md transition-all duration-300 ${
                  badge.unlocked
                    ? `bg-gradient-to-br ${badge.color}`
                    : 'bg-gray-100'
                }`}
              >
                <badge.icon className={`text-4xl mx-auto mb-3 ${
                  badge.unlocked ? 'text-white' : 'text-gray-300'
                }`} />
                <p className={`font-bold text-sm mb-1 ${
                  badge.unlocked ? 'text-white' : 'text-gray-400'
                }`}>
                  {badge.name}
                </p>
                <p className={`text-xs ${
                  badge.unlocked ? 'text-white/80' : 'text-gray-400'
                }`}>
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Goal Button */}
      <button
        className="w-full bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-dashed border-purple-300 rounded-3xl p-8 cursor-pointer hover:border-purple-500 hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        <FaBullseye className="text-5xl text-purple-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800 mb-2">create new goal</h3>
        <p className="text-sm text-gray-600">set a target and track your journey</p>
      </button>
    </div>
  )

  const SettingsScreen = () => (
    <div className="space-y-6 pb-28">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className="text-gray-600 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-full"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            settings
          </h2>
          <p className="text-gray-600 text-sm mt-1">make it yours</p>
        </div>
      </div>

      {/* Category Limits */}
      <Card className="shadow-xl rounded-3xl border-none bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 text-xl">category limits</CardTitle>
          <CardDescription className="text-gray-600">adjust your monthly budgets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {budgets.map(budget => {
            const category = CATEGORIES.find(c => c.id === budget.category)
            return (
              <div key={budget.category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {category && (
                      <div className={`bg-gradient-to-br ${category.gradient} rounded-xl p-2 shadow-md`}>
                        <category.icon className="text-white text-lg" />
                      </div>
                    )}
                    <span className="font-bold text-gray-800">{category?.name}</span>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ₹{budget.limit.toLocaleString('en-IN')}
                  </span>
                </div>
                <Slider
                  value={[budget.limit]}
                  onValueChange={(value) => {
                    setBudgets(budgets.map(b =>
                      b.category === budget.category ? { ...b, limit: value[0] } : b
                    ))
                  }}
                  min={2000}
                  max={50000}
                  step={500}
                  className="w-full"
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Tone Preference */}
      <Card className="shadow-xl rounded-3xl border-none bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 text-xl">tone preference</CardTitle>
          <CardDescription className="text-gray-600">how should we talk to you?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(['gentle', 'motivational', 'direct'] as const).map(option => (
            <button
              key={option}
              onClick={() => setTone(option)}
              className={`w-full p-5 rounded-2xl text-left transition-all duration-300 ${
                tone === option
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-400 shadow-lg scale-105'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:scale-102'
              }`}
            >
              <p className="font-bold text-gray-800 capitalize mb-1">{option}</p>
              <p className="text-sm text-gray-600">
                {option === 'gentle' && 'soft, compassionate, understanding'}
                {option === 'motivational' && 'energizing, encouraging, positive'}
                {option === 'direct' && 'clear, straightforward, factual'}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Color Theme */}
      <Card className="shadow-xl rounded-3xl border-none bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 text-xl">color vibe</CardTitle>
          <CardDescription className="text-gray-600">pick your aesthetic</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(['dreamy', 'vibrant', 'calm'] as const).map(theme => (
            <button
              key={theme}
              onClick={() => setColorTheme(theme)}
              className={`w-full p-5 rounded-2xl text-left transition-all duration-300 ${
                colorTheme === theme
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-400 shadow-lg scale-105'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:scale-102'
              }`}
            >
              <p className="font-bold text-gray-800 capitalize mb-1">{theme}</p>
              <p className="text-sm text-gray-600">
                {theme === 'dreamy' && 'soft gradients, pastel colors, chill vibes'}
                {theme === 'vibrant' && 'bold colors, high energy, playful'}
                {theme === 'calm' && 'muted tones, minimal, zen'}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="shadow-xl rounded-3xl border-none bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 text-xl">notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            'budget alerts at 75%',
            'daily mindfulness reminders',
            'weekly insights summary',
            'goal milestone celebrations'
          ].map((option, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md">
              <span className="text-sm font-semibold text-gray-700">{option}</span>
              <div className="w-14 h-7 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full relative shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg">
                <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  // Bottom Navigation
  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 shadow-2xl z-50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {[
            { id: 'dashboard' as Screen, icon: FaHome, label: 'home' },
            { id: 'track' as Screen, icon: FaPlusCircle, label: 'track' },
            { id: 'insights' as Screen, icon: FaChartLine, label: 'insights' },
            { id: 'goals' as Screen, icon: FaBullseye, label: 'goals' }
          ].map(nav => (
            <button
              key={nav.id}
              onClick={() => setCurrentScreen(nav.id)}
              className={`flex flex-col items-center space-y-1 px-5 py-2 rounded-2xl transition-all duration-300 ${
                currentScreen === nav.id
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 scale-110'
                  : 'text-gray-500 hover:text-gray-700 hover:scale-105'
              }`}
            >
              <nav.icon className={`text-2xl transition-all duration-300 ${
                currentScreen === nav.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent scale-110'
                  : ''
              }`} />
              <span className={`text-xs font-bold ${
                currentScreen === nav.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
                  : ''
              }`}>
                {nav.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
              ImpulSave
            </h1>
            <p className="text-sm text-gray-600 font-medium mt-1">your spending companion</p>
          </div>
          <button
            onClick={() => setCurrentScreen('settings')}
            className="p-3 rounded-full hover:bg-gradient-to-br hover:from-purple-100 hover:to-pink-100 transition-all duration-300 hover:scale-110"
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

      {/* Celebration Overlay */}
      {showCelebration && <Celebration />}
    </div>
  )
}
