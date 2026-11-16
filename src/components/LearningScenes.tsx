import { JsLab } from './learning/JsLab.tsx';
import { SqlLab } from './learning/SqlLab.tsx';
import { ReactLab } from './learning/ReactLab.tsx';
import { PythonLab } from './learning/PythonLab.tsx';
import { AwsLab } from './learning/AwsLab.tsx';
import './LearningScenes.css';
import './learning/LearningLab.css';

const scenes = { javascript: JsLab, react: ReactLab, data: SqlLab, code: PythonLab, cloud: AwsLab };
// kind comes from learningTopics[].theme, which is inferred as a plain string.
export function LearningScene({ kind }: { kind: string }) {
  const Scene = scenes[kind as keyof typeof scenes];
  return <Scene />;
}
