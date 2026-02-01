import { Star } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function StarRating({ rating, size = 'sm', interactive = false, onChange }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizes[size],
            interactive && 'cursor-pointer transition-transform hover:scale-110',
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
          )}
          onClick={() => interactive && onChange?.(star)}
        />
      ))}
    </div>
  );
}