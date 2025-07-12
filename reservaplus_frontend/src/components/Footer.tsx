const Footer = () => {
  return (
    <footer className="bg-white shadow-lg mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} ReservaPlus. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer 