export const PAYMENT_STATUS = {
  pending: "pending",
  paid: "paid",
  confirmedNoSinpe: "confirmed_no_sinpe",
};

export function paymentStatusLabel(status) {
  switch (status) {
    case PAYMENT_STATUS.paid:
      return "Pagado";
    case PAYMENT_STATUS.confirmedNoSinpe:
      return "Confirmada sin SINPE";
    case PAYMENT_STATUS.pending:
    default:
      return "Pendiente";
  }
}

export function isConfirmedStatus(status) {
  return (
    status === PAYMENT_STATUS.paid || status === PAYMENT_STATUS.confirmedNoSinpe
  );
}
