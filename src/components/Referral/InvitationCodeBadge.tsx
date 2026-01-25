import { useState } from 'react';
import { Copy, Check, Gift, Users, TrendingUp, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvitationCodeBadgeProps {
  invitationCode: string;
  showCopy?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'success';
  className?: string;
  showStats?: boolean;
  referralCount?: number;
  referralTier?: string;
}

const InvitationCodeBadge: React.FC<InvitationCodeBadgeProps> = ({
  invitationCode,
  showCopy = true,
  size = 'md',
  variant = 'default',
  className,
  showStats = false,
  referralCount = 0,
  referralTier = 'bronze'
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy invitation code:', err);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const variantClasses = {
    default: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-700',
    outline: 'border-purple-300 text-purple-700 bg-white hover:bg-purple-50',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-700'
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'text-purple-600 bg-purple-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      default: return 'text-orange-600 bg-orange-100';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return '💎';
      case 'gold': return '🏆';
      case 'silver': return '🥈';
      default: return '🥉';
    }
  };

  return (
    <div className={cn('inline-flex flex-col items-start gap-2', className)}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'inline-flex items-center gap-2 rounded-lg border font-mono font-semibold transition-all hover:scale-105',
          sizeClasses[size],
          variantClasses[variant]
        )}>
          <Gift className="w-4 h-4" />
          <span>{invitationCode}</span>
        </div>
        
        {showCopy && (
          <button
            onClick={copyToClipboard}
            className={cn(
              'p-2 rounded-lg transition-all hover:scale-110',
              'hover:bg-purple-100 text-purple-600',
              copied && 'bg-green-100 text-green-600'
            )}
            title={copied ? 'Copied!' : 'Copy invitation code'}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}

        <button
          className="p-2 rounded-lg transition-all hover:scale-110 hover:bg-blue-100 text-blue-600"
          title="Share invitation code"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {showStats && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{referralCount} referrals</span>
          </div>
          
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            getTierColor(referralTier)
          )}>
            <span>{getTierIcon(referralTier)}</span>
            <span className="capitalize">{referralTier}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationCodeBadge;
