'use client';

import { CourseProvider, useCourse } from '@/components/providers/CourseProvider';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { CourseStageRenderer } from '@/components/course/CourseStageRenderer';

function HomeContent() {
  const { dispatch } = useCourse();
  
  const handleNewCourse = () => {
    dispatch({ type: 'RESET_STATE' });
    dispatch({ type: 'SET_STAGE', payload: 'prompt' });
  };
  
  return (
    <Layout onNewCourse={handleNewCourse}>
      <main>
        <Card>
          <CourseStageRenderer />
        </Card>
      </main>
    </Layout>
  );
}

export default function Home() {
  return (
    <CourseProvider>
      <HomeContent />
    </CourseProvider>
  );
}
