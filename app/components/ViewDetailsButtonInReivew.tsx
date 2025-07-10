import { Button } from "@mui/material";
import { useRouter } from "next/navigation";

interface ReviewButtonProps {
  status: string | undefined;
}

const ReviewButton: React.FC<ReviewButtonProps> = ({ status }) => {
  const router = useRouter();
  
  // Only show review button for delivered orders
  if (status?.toLowerCase() !== 'delivered') {
    return null;
  }
  
  return (
    <div className="mt-4 text-right">
      <Button 
        onClick={() => router.push('/toreveiwpage')}
        variant="contained"
        disableElevation
        sx={{ 
          backgroundColor: 'black !important', 
          color: 'white',
          '&:hover': { 
            backgroundColor: '#333 !important' // Slightly lighter black on hover for better UX
          },
          fontWeight: 'medium',
          padding: '8px 16px',
          boxShadow: 'none',
          textTransform: 'none'
        }}
      >
        Review this item
      </Button>
    </div>
  );
};

export default ReviewButton;
