'use client'

import { SignIn } from '@clerk/nextjs'
import { CreditCard } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        {/* Logo and header - matching your app style */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CreditCard className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Sign in to manage your bank statements</p>
        </div>
        
        {/* Clerk SignIn component styled to match shadcn/ui */}
        <SignIn 
          appearance={{
            baseTheme: undefined,
            variables: {
              colorPrimary: 'hsl(221.2 83.2% 53.3%)',
              colorText: 'hsl(222.2 84% 4.9%)',
              colorTextSecondary: 'hsl(215.4 16.3% 46.9%)',
              colorBackground: 'hsl(0 0% 100%)',
              colorInputBackground: 'hsl(0 0% 100%)',
              colorInputText: 'hsl(222.2 84% 4.9%)',
              borderRadius: '0.75rem',
              fontFamily: 'inherit',
            },
            elements: {
              rootBox: "w-full",
              card: "bg-card shadow-sm rounded-lg border p-6",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: `
                relative w-full inline-flex items-center justify-center rounded-md text-sm font-medium
                ring-offset-background transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                disabled:pointer-events-none disabled:opacity-50
                border border-input bg-background hover:bg-accent hover:text-accent-foreground
                h-10 px-4 py-2
              `,
              socialButtonsBlockButtonText: "font-medium",
              socialButtonsProviderIcon: "w-4 h-4 mr-2",
              dividerLine: "bg-border",
              dividerText: "bg-background px-2 text-muted-foreground text-xs uppercase",
              formFieldLabel: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              formFieldInput: `
                flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                ring-offset-background
                file:border-0 file:bg-transparent file:text-sm file:font-medium
                placeholder:text-muted-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50
              `,
              formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground absolute right-3 top-3",
              formButtonPrimary: `
                inline-flex items-center justify-center rounded-md text-sm font-medium
                ring-offset-background transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                disabled:pointer-events-none disabled:opacity-50
                bg-primary text-primary-foreground hover:bg-primary/90
                h-10 px-4 py-2 w-full
              `,
              footerActionLink: "text-primary underline-offset-4 hover:underline text-sm",
              footerActionText: "text-muted-foreground text-sm",
              identityPreviewText: "text-sm text-foreground",
              identityPreviewEditButtonIcon: "text-muted-foreground hover:text-foreground",
              formResendCodeLink: "text-primary underline-offset-4 hover:underline text-sm",
              otpCodeFieldInput: `
                flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                ring-offset-background
                placeholder:text-muted-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50
              `,
              formFieldAction: "text-primary underline-offset-4 hover:underline text-sm",
              formFieldError: "text-sm font-medium text-destructive",
              alert: "rounded-lg border p-4",
              alertText: "text-sm [&:first-child]:mt-0",
            },
            layout: {
              socialButtonsPlacement: 'top',
              socialButtonsVariant: 'blockButton',
              showOptionalFields: false,
            }
          }}
          redirectUrl="/"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}