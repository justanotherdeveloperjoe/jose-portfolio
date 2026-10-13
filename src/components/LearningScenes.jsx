import { JsLab } from './learning/JsLab.jsx';
import { SqlLab } from './learning/SqlLab.jsx';
import { ReactLab } from './learning/ReactLab.jsx';
import { PythonLab } from './learning/PythonLab.jsx';
import { AwsLab } from './learning/AwsLab.jsx';
import './LearningScenes.css';
import './learning/LearningLab.css';

const scenes = { javascript: JsLab, react: ReactLab, data: SqlLab, code: PythonLab, cloud: AwsLab };
export function LearningScene({ kind }) {
  const Scene = scenes[kind];
  return <Scene />;
}
