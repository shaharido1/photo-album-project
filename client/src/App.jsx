import Greeting from './features/greeting/Greeting';
import Foo from './features/foo/Foo';
import Version from './features/version/Version';

function App() {
  return (
    <div className="text-center mt-12">
      <Greeting />
      <Foo />
      <Version />
    </div>
  );
}

export default App;
