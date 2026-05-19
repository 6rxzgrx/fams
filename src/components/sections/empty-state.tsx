import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface p-8 text-center',
				className,
			)}
		>
			{Icon && (
				<Icon className="size-8 text-muted-foreground" strokeWidth={1.5} />
			)}
			<div>
				<p className="font-semibold">{title}</p>
				{description && (
					<p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
				)}
			</div>
			{action}
		</div>
	);
}
