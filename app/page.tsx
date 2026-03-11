import { EventRadarDashboard } from "@/components/event-radar-dashboard";
import { getEvents } from "@/lib/server-events";

export default async function Home() {
  const events = await getEvents();

  return <EventRadarDashboard events={events} />;
}
