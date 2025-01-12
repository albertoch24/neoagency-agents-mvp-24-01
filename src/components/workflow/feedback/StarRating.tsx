import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

export const StarRating = ({ rating, onRatingChange }: StarRatingProps) => {
  return (
    <div className="flex justify-center space-x-2">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          onClick={() => onRatingChange(value)}
          className="focus:outline-none"
        >
          {value <= rating ? (
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
          ) : (
            <StarHalf className="h-6 w-6 text-gray-300" />
          )}
        </button>
      ))}
    </div>
  );
};