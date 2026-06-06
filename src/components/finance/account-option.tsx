import { cn } from '@/lib/utils'
import { AssetImage } from '@/components/finance/asset-image'
import type { Asset } from '@/domain/types'

type Props = {
  account: Pick<Asset, 'type' | 'bank_name' | 'name' | 'color' | 'icon'>
  /** Right-aligned trailing content (balance, star, etc.). */
  trailing?: React.ReactNode
  className?: string
}

/**
 * The standard account label used in every account picker, dropdown, and trigger
 * (transaction form, transfer, move balance, pay bill, filters). Always shows the
 * brand logo via {@link AssetImage} (falling back to the colored type icon) plus
 * the account name, so account selection looks identical everywhere.
 */
export function AccountOption({ account, trailing, className }: Props) {
  return (
    <span className={cn('flex min-w-0 flex-1 items-center gap-2', className)}>
      <AssetImage
        type={account.type}
        bankName={account.bank_name}
        name={account.name}
        icon={account.icon}
        color={account.color}
        size="sm"
      />
      <span className="min-w-0 flex-1 truncate text-left">{account.name}</span>
      {trailing}
    </span>
  )
}
