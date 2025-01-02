import { useSocket } from '@/hooks/useSocket';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CurrentPositions = () => {
  const { positions, isConnected } = useSocket();

  return (
    <Card className='w-60'>
      <CardHeader>
        <CardTitle>Current Positions</CardTitle>
      </CardHeader>
      {isConnected ? (
        <CardContent className='flex flex-col gap-y-4'>
          <div className='flex gap-x-4 items-center'>
            <p className=''>J1: </p>
            <p>{positions.j1}</p>
          </div>
          <div className='flex gap-x-4 items-center'>
            <p className=''>J2: </p>
            <p>{positions.j2}</p>
          </div>
          <div className='flex gap-x-4 items-center'>
            <p className=''>J3: </p>
            <p>{positions.j3}</p>
          </div>
          <div className='flex gap-x-4 items-center'>
            <p className=''>JZ: </p>
            <p>{positions.jz}</p>
          </div>
        </CardContent>
      ) : (
        <p>Not Connected</p>
      )}
    </Card>
  );
};

export default CurrentPositions;
