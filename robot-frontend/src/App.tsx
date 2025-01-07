import useSWR from 'swr';
import { PulseLoader } from 'react-spinners';

import { fetcher } from '@/lib/fetcher';

import HomeControls from '@/components/home-controls';
import JointControls from '@/components/joint-controls';
import CurrentPositions from '@/components/current-positions';
import CartesianPositions from '@/components/cartesian-positions';
import CartesianControls from '@/components/cartesian-controls';

const App = () => {
  const {
    data: dataJoints,
    isLoading: isLoadingJ,
    error: errorJ,
  } = useSWR('/api/joint-controls', fetcher);

  const {
    data: dataCartesian,
    isLoading: isLoadingC,
    error: errorC,
  } = useSWR('/api/cartesian-controls', fetcher);

  if (isLoadingJ || isLoadingC)
    return (
      <div className='flex justify-center items-center h-screen'>
        <PulseLoader color='white' />
      </div>
    );

  if (errorJ || errorC)
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Error: {errorJ && errorJ.message}</p>
        <p>Error: {errorC && errorC.message}</p>
      </div>
    );

  return (
    <div className='mx-8 my-8 flex gap-x-8'>
      <HomeControls />
      <div className='flex flex-col gap-y-8'>
        <JointControls
          j1={dataJoints['j1']}
          j2={dataJoints['j2']}
          j3={dataJoints['j3']}
          jz={dataJoints['jz']}
        />
        <CartesianControls
          xP={dataCartesian['xP']}
          yP={dataCartesian['yP']}
          zP={dataCartesian['zP']}
        />
      </div>
      <div className='flex flex-col gap-y-8'>
        <CurrentPositions />
        <CartesianPositions />
      </div>
    </div>
  );
};

export default App;
