"use client";

import AppointmentRequestsView from "@/components/appointments/AppointmentRequestsView";

export default function AppointmentsPage() {
  return (
    <AppointmentRequestsView
      title="Appointments"
      subtitle={'Requests from the website Home page "Plan your first visit" appointment form.'}
      noun="appointment"
      sources={["home2"]}
      icon="appointment"
    />
  );
}
