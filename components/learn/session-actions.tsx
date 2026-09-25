import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SessionActions({
  done,
  completeLabel,
  doneLabel,
  onComplete,
  continueTo,
  continueLabel,
}: {
  done: boolean
  completeLabel: string
  doneLabel: string
  onComplete: () => void
  continueTo: string
  continueLabel: string
}) {
  return (
    <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 mt-auto flex flex-col gap-2 bg-background/95 pt-3 backdrop-blur">
      <Button type="button" onClick={onComplete} disabled={done}>
        {done ? (
          <>
            <Check />
            {doneLabel}
          </>
        ) : (
          completeLabel
        )}
      </Button>
      <Button asChild variant="ghost">
        <Link to={continueTo}>{continueLabel}</Link>
      </Button>
    </div>
  )
}
