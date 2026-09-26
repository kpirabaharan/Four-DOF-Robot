import CartesianControls from '@/components/cartesian-controls';
import CartesianPositions from '@/components/cartesian-positions';
import CurrentPositions from '@/components/current-positions';
import HomeControls from '@/components/home-controls';
import JointControls from '@/components/joint-controls';

const App = () => {
  return (
    <div className='mx-8 my-8 flex gap-x-8'>
      <HomeControls />
      <div className='flex flex-col gap-y-8'>
        <JointControls />
        <CartesianControls />
      </div>
      <div className='flex flex-col gap-y-8'>
        <CurrentPositions />
        <CartesianPositions />
      </div>
    </div>
  );
};

export default App;
