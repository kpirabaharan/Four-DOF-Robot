import { FaHome } from 'react-icons/fa';

import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/axios';

import { Button } from '@/components/ui/button';

const HomeControls = () => {
  const { toast } = useToast();

  const handleHome = async () => {
    await api.post('/api/home');
    toast({
      title: 'Homing',
    });
  };

  return (
    <div>
      <Button size={'icon'} onClick={handleHome}>
        <FaHome />
      </Button>
    </div>
  );
};

export default HomeControls;
