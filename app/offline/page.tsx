import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-muted">
            <WifiOff className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">You&apos;re offline</h1>
        <p className="text-muted-foreground mb-6">
          This page hasn&apos;t been saved for offline use. Reconnect to the internet and try
          again.
        </p>
        <Button asChild>
          <Link href="/">Try again</Link>
        </Button>
      </div>
    </div>
  )
}
