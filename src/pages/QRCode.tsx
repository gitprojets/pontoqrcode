import { MainLayout } from '@/components/layout/MainLayout';
import { QRCodeGenerator } from '@/components/qrcode/QRCodeGenerator';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory';

export default function QRCodePage() {
  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Meu QR Code
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Apresente este código ao diretor para registrar sua presença
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <QRCodeGenerator />
          <AttendanceHistory />
        </div>
      </div>
    </MainLayout>
  );
}
