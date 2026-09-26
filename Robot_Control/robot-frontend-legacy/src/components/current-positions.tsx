import { useSocket } from '@/hooks/use-socket';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CurrentPositions = () => {
  const { positions, isConnected } = useSocket();

  return (
    <Card className='w-80'>
      <CardHeader>
        <CardTitle>Current Positions</CardTitle>
      </CardHeader>
      {isConnected ? (
        <CardContent className='flex flex-col gap-y-4'>
          <div className='grid grid-cols-2 gap-x-4 items-center'>
            <div>
              <p className=''>J1: {positions.j1}°</p>
            </div>
            <div>
              <p className=''>S1: {positions.s1} steps</p>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-x-4 items-center'>
            <div>
              <p className=''>J2: {positions.j2}°</p>
            </div>
            <div>
              <p className=''>S2: {positions.s2} steps</p>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-x-4 items-center'>
            <div>
              <p className=''>J3: {positions.j3}°</p>
            </div>
            <div>
              <p className=''>S3: {positions.s3} steps</p>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-x-4 items-center'>
            <div>
              <p className=''>JZ: {positions.jz}°</p>
            </div>
            <div>
              <p className=''>SZ: {positions.sz} steps</p>
            </div>
          </div>
        </CardContent>
      ) : (
        <p>Not Connected</p>
      )}
    </Card>
  );
};

export default CurrentPositions;
