import useSWR from 'swr';
import { PulseLoader } from 'react-spinners';

import { fetcher } from '@/lib/fetcher';

import HomeControls from '@/components/home-controls';
import JointControls from '@/components/joint-controls';
import CurrentPositions from '@/components/current-positions';
import CartesianPositions from '@/components/cartesian-positions';

const App = () => {
  const { data, isLoading, error } = useSWR('/api/joint-controls', fetcher);

  if (isLoading)
    return (
      <div className='flex justify-center items-center h-screen'>
        <PulseLoader color='white' />
      </div>
    );

  if (error)
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Error: {error.message}</p>
      </div>
    );

  return (
    <div className='mx-8 my-8 flex gap-x-8'>
      <HomeControls />
      <div className='flex flex-col gap-y-8'>
        <JointControls
          j1={data['j1']}
          j2={data['j2']}
          j3={data['j3']}
          jz={data['jz']}
        />
        {/* <CartesianControls /> */}
      </div>
      <div className='flex flex-col gap-y-8'>
        <CurrentPositions />
        <CartesianPositions />
      </div>
    </div>
  );
};

export default App;
