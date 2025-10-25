export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
  onSuccess?: () => void;
}

export interface AuthFormData {
  email: string
  password?: string
  token?: string
}

export interface AuthState {
  isLoading: boolean
  error: string | null
  success: string | null
  step: 'form' | 'otp' | 'success'
}

export interface OTPVerificationProps {
  email: string
  onVerify: (token: string) => Promise<void>
  onResend: () => Promise<void>
  isLoading: boolean
  error: string | null
}

export interface UserMenuProps {
  user: {
    id: string
    email: string
    name: string | null
    avatarUrl: string | null
  }
  onSignOut: () => Promise<void>
}
