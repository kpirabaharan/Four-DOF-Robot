import { useSocket } from '@/hooks/use-socket';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CartesianPositions = () => {
  const { isConnected, positions } = useSocket();

  return (
    <Card className='w-80'>
      <CardHeader>
        <CardTitle>Current Positions</CardTitle>
      </CardHeader>
      {isConnected ? (
        <CardContent className='flex flex-col gap-y-4'>
          <p className=''>X: {positions.xP}</p>
          <p className=''>Y: {positions.yP}</p>
          <p className=''>Z: {positions.zP}</p>
        </CardContent>
      ) : (
        <p>Not Connected</p>
      )}
    </Card>
  );
};

export default CartesianPositions;
