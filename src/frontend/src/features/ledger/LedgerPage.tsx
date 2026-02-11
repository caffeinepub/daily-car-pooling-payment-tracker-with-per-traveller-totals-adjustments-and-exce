import { useState } from 'react';
import AppHeader from '../../components/AppHeader';
import TravellerManager from './TravellerManager';
import DateRangePicker from './DateRangePicker';
import DailyParticipationGrid from './DailyParticipationGrid';
import SummaryPanel from './SummaryPanel';
import ExportButton from './ExportButton';
import RatePerTripControl from './RatePerTripControl';
import { LedgerStateProvider } from './LedgerStateContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Receipt } from 'lucide-react';

function LedgerPageContent() {
  const [activeTab, setActiveTab] = useState('grid');

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 container py-6 px-4 space-y-6">
        {/* Date Range, Rate & Export */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <DateRangePicker />
            <ExportButton />
          </div>
          <div className="flex justify-start">
            <RatePerTripControl />
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="travellers">
                <Users className="h-4 w-4 mr-2" />
                Travellers
              </TabsTrigger>
              <TabsTrigger value="grid">
                <Calendar className="h-4 w-4 mr-2" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="summary">
                <Receipt className="h-4 w-4 mr-2" />
                Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="travellers" className="mt-4">
              <TravellerManager />
            </TabsContent>

            <TabsContent value="grid" className="mt-4">
              <DailyParticipationGrid />
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              <SummaryPanel />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <TravellerManager />
          </div>

          <div className="lg:col-span-6">
            <DailyParticipationGrid />
          </div>

          <div className="lg:col-span-3">
            <SummaryPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} · Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

export default function LedgerPage() {
  return (
    <LedgerStateProvider>
      <LedgerPageContent />
    </LedgerStateProvider>
  );
}
