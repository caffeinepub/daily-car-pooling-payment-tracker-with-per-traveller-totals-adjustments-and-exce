import CashPaymentForm from './CashPaymentForm';
import OtherPendingAmountForm from './OtherPendingAmountForm';
import { useLedgerState } from './LedgerStateContext';
import type { CashPayment, OtherPending } from '../../hooks/useLedgerLocalState';

interface SummaryPanelActionsCellProps {
  travellerId: string;
  travellerName: string;
}

export default function SummaryPanelActionsCell({ travellerId, travellerName }: SummaryPanelActionsCellProps) {
  const { addCashPayment, addOtherPending } = useLedgerState();

  const handleAddPayment = (payment: Omit<CashPayment, 'id'>) => {
    addCashPayment(payment);
  };

  const handleAddOtherPending = (pending: Omit<OtherPending, 'id'>) => {
    addOtherPending(pending);
  };

  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <CashPaymentForm
        travellerId={travellerId}
        travellerName={travellerName}
        onSubmit={handleAddPayment}
      />
      <OtherPendingAmountForm
        travellerId={travellerId}
        travellerName={travellerName}
        onSubmit={handleAddOtherPending}
      />
    </div>
  );
}
