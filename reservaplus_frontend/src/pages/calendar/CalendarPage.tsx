import React from 'react'
import Calendar from '../../components/calendar/Calendar'
// import ClientTable from '../../components/clients/ClientTable'

const CalendarPage: React.FC = () => {
  return <Calendar />

  // Example of how to use ClientTable in CalendarPage if needed:
  // const [clients, setClients] = useState<Client[]>([])
  // const [loading, setLoading] = useState(false)
  // const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  //
  // return (
  //   <div>
  //     <Calendar />
  //     <ClientTable 
  //       clients={clients}
  //       loading={loading}
  //       activeDropdown={activeDropdown}
  //       setActiveDropdown={setActiveDropdown}
  //       showPagination={false}
  //     />
  //   </div>
  // )
}

export default CalendarPage