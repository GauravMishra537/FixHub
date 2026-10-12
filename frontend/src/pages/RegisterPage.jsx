import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, resendVerification } from '../api/auth'
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'

export function RegisterPage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [registeredEmail, setRegisteredEmail] = useState(null)
  const [resendStatus, setResendStatus] = useState(null)
  const [manualToken, setManualToken] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }))
    }
    setError(null)
  }

  const validate = () => {
    const errors = {}

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      errors.email = 'Work email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid work email address'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError(null)

    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })

      setRegisteredEmail(formData.email.trim().toLowerCase())
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!registeredEmail) return
    setResendStatus('sending')
    try {
      await resendVerification(registeredEmail)
      setResendStatus('sent')
    } catch (err) {
      setResendStatus('error')
    }
  }

  const handleManualVerifySubmit = (e) => {
    e.preventDefault()
    if (!manualToken.trim()) return
    navigate(`/verify-email?token=${encodeURIComponent(manualToken.trim())}`)
  }

  if (registeredEmail) {
    return (
      <div className="max-w-md mx-auto py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Your Email</h2>
          <p className="mt-2 text-sm text-slate-600">
            A verification link has been sent to:
          </p>
          <p className="mt-1 font-semibold text-slate-900 text-sm bg-slate-50 py-1.5 px-3 rounded-md border border-slate-100 inline-block font-mono">
            {registeredEmail}
          </p>

          <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-left text-xs text-slate-600 space-y-2">
            <div className="flex items-center space-x-1.5 text-slate-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Next Steps:</span>
            </div>
            <p>1. Confirm your email address using the sent link.</p>
            <p>2. An administrator will review your account and assign your department, role, and workspace permissions.</p>
          </div>

          <form onSubmit={handleManualVerifySubmit} className="mb-6 text-left">
            <label htmlFor="manualToken" className="block text-xs font-medium text-slate-700 mb-1">
              Have a verification token?
            </label>
            <div className="flex gap-2">
              <input
                id="manualToken"
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Enter token here"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                Verify
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendStatus === 'sending'}
              className="text-blue-600 hover:text-blue-700 font-medium underline disabled:opacity-50"
            >
              {resendStatus === 'sending' ? 'Sending...' : 'Resend link'}
            </button>
            {resendStatus === 'sent' && (
              <span className="text-emerald-600 font-medium">Link resent!</span>
            )}

            <Link
              to="/"
              className="inline-flex items-center text-slate-700 hover:text-slate-900 font-medium"
            >
              Back to Home <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
          <p className="mt-1 text-xs text-slate-500">
            Basic info only. Department and workspace role are assigned by administrator.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                  fieldErrors.fullName ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>
            {fieldErrors.fullName && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                  fieldErrors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg border ${
                  fieldErrors.password ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg border ${
                  fieldErrors.confirmPassword ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
