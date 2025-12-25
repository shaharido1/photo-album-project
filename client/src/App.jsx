import Greeting from './features/greeting/Greeting';
import Foo from './features/foo/Foo';
import Version from './features/version/Version';

function App() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <Greeting />
      <Foo />
      <Version />
    </div>
  );
}

export default App;
