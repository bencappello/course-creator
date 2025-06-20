'use client';

import { CourseProvider } from '@/components/providers/CourseProvider';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { CourseStageRenderer } from '@/components/course/CourseStageRenderer';

export default function Home() {
  return (
    <CourseProvider>
      <Layout>
        <main>
          <Card>
            <CourseStageRenderer />
          </Card>
        </main>
      </Layout>
    </CourseProvider>
  );
}
