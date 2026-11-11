import { useEffect, useState, type FormEvent } from "react";
import { AppointmentCard } from "../components/AppointmentCard";
import { StatCard } from "../components/StatCard";
//import { citasIniciales } from "../data/citas";
import {
  actualizarEstado, obtenerCitas, registrarCita
} from "../services/citaApi";

import type { Cita, EstadoCita, NuevaCita } from "../types";

type Filtro = "todas" | EstadoCita;

export function AppointmentsPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarCitas() {
      try {
        setCargando(true);
        setCitas(await obtenerCitas());
      } catch (error) {
        setError(error instanceof Error ? error.message : "Ocurrió un error.");
      } finally {
        setCargando(false);
      }
    }

    void cargarCitas();
  }, []);

  async function confirmarCita(id: number) {
    try {
      const actualizada = await actualizarEstado(id, "confirmada");
      setCitas((actuales) =>
        actuales.map((cita) => (cita.id === id ? actualizada : cita)),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al confirmar.");
    }
  }

  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [mensaje, setMensaje] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [nuevaCita, setNuevaCita] = useState<NuevaCita>({
    mascota: "",
    cliente: "",
    servicio: "",
    fecha: "",
    hora: "",
  });

  async function guardarCita(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const citaRegistrada = await registrarCita(nuevaCita);

      setCitas((actuales) => [...actuales, citaRegistrada]);

      setNuevaCita({
        mascota: "",
        cliente: "",
        servicio: "",
        fecha: "",
        hora: "",
      });

      setModalAbierto(false);
      setMensaje("La cita se registró correctamente.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error al registrar la cita.",
      );
    } finally {
      setGuardando(false);
    }
  }

  const citasFiltradas =
    filtro === "todas" ? citas : citas.filter((cita) => cita.estado === filtro);

  const pendientes = citas.filter((c) => c.estado === "solicitada").length;
  const confirmadas = citas.filter((c) => c.estado === "confirmada").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">Agenda de citas</h2>
          <p className="mt-1 text-slate-600">
            Consulta y administra las citas del día.
          </p>
        </div>
        <button
          onClick={() => {
            setError("");
            setMensaje("");
            setModalAbierto(true);
          }}
          className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800"
        >
          + Nueva cita
        </button>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          titulo="Citas de hoy"
          valor={citas.length}
          color="text-teal-700"
        />
        <StatCard
          titulo="Pendientes"
          valor={pendientes}
          color="text-amber-600"
        />
        <StatCard
          titulo="Confirmadas"
          valor={confirmadas}
          color="text-green-600"
        />
      </section>

      <section className="mt-8">
        <label
          htmlFor="filtro"
          className="mb-2 block font-semibold text-slate-700"
        >
          Filtrar por estado
        </label>
        <select
          id="filtro"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as Filtro)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 sm:w-64"
        >
          <option value="todas">Todas</option>
          <option value="solicitada">Solicitadas</option>
          <option value="confirmada">Confirmadas</option>
          <option value="atendida">Atendidas</option>
        </select>
      </section>

      {mensaje && (
        <p
          aria-live="polite"
          className="mt-6 rounded-xl bg-green-100 px-4 py-3 text-green-800"
        >
          {mensaje}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-100 px-4 py-3 text-red-800"
        >
          {error}
        </p>
      )}

      <section className="mt-6 grid gap-4">
        {cargando ? (
          <p className="rounded-2xl bg-white p-8 text-center text-slate-500">
            Cargando citas...
          </p>
        ) : citasFiltradas.length > 0 ? (
          citasFiltradas.map((cita) => (
            <AppointmentCard
              key={cita.id}
              cita={cita}
              onConfirmar={confirmarCita}
            />
          ))
        ) : (
          <p className="rounded-2xl bg-white p-8 text-center text-slate-500">
            No se encontraron citas con ese estado.
          </p>
        )}
      </section>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-950">
                Registrar nueva cita
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                disabled={guardando}
                className="text-2xl text-slate-500 hover:text-slate-800"
              >
                &times;
              </button>
            </div>

            <form onSubmit={guardarCita} className="space-y-4">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Nombre de la mascota
                </label>
                <input
                  type="text"
                  required
                  value={nuevaCita.mascota}
                  onChange={(e) =>
                    setNuevaCita({ ...nuevaCita, mascota: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Nombre de la mascota"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Nombre del cliente
                </label>
                <input
                  type="text"
                  required
                  value={nuevaCita.cliente}
                  onChange={(e) =>
                    setNuevaCita({ ...nuevaCita, cliente: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Servicio
                </label>
                <input
                  type="text"
                  required
                  value={nuevaCita.servicio}
                  onChange={(e) =>
                    setNuevaCita({ ...nuevaCita, servicio: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Tipo de servicio"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={nuevaCita.fecha}
                  onChange={(e) =>
                    setNuevaCita({ ...nuevaCita, fecha: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Hora
                </label>
                <input
                  type="time"
                  required
                  value={nuevaCita.hora}
                  onChange={(e) =>
                    setNuevaCita({ ...nuevaCita, hora: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  disabled={guardando}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Registrar cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}