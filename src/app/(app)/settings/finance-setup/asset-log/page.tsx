import { AssetLogPanel } from '@/components/finance/asset-log-panel'

export default function AssetLogPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-semibold leading-tight tracking-tight lg:text-[24px]">
          Asset Log
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Riwayat perubahan saldo dan nilai aset keluarga.
        </p>
      </div>
      <AssetLogPanel />
    </div>
  )
}
