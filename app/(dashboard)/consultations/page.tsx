"use client";

import AppointmentRequestsView from "@/components/appointments/AppointmentRequestsView";

export default function ConsultationsPage() {
  return (
    <AppointmentRequestsView
      title="Consultations"
      subtitle={'Requests from the website\'s "Plan your consultation" popup and the Panchakarma "Request a consultation" form.'}
      noun="consultation"
      sources={["consultation", "panchakarma"]}
      showEmailAndTime
      icon="consultation"
    />
  );
}
