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
    <div className="mt-4 text-right ">
      <Button 
        onClick={() => router.push('/productReview')}
        variant="contained"
        disableElevation
        sx={{ 
          backgroundColor: 'black ', 
          color: 'white',
          '&:hover': { 
            backgroundColor: '#333 !important' // Slightly lighter black on hover for better UX
          },
          fontWeight: 'large',
          padding: '6px 10px',
          boxShadow: 'none',
          textTransform: 'none',
          borderRadius: '10px', // Adding rounded corners to the button
        }}
      >
        Review
      </Button>
    </div>
  );
};

export default ReviewButton;
