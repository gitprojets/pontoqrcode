import { MainLayout } from '@/components/layout/MainLayout';
import { AttendanceScanner } from '@/components/attendance/AttendanceScanner';

export default function Registro() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Registro de Presença
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as leituras de QR Code em tempo real
          </p>
        </div>

        <AttendanceScanner />
      </div>
    </MainLayout>
  );
}
