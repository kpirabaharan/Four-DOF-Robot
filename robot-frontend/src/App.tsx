import JointControls from '@/components/joint-controls';
import CurrentPositions from './components/current-positions';

const App = () => {
  return (
    <div className='mx-8 my-8 flex gap-x-8'>
      <JointControls />
      <div>
        <CurrentPositions />
      </div>
    </div>
  );
};

export default App;
