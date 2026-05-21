import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, MessageSquare, CheckCircle, XCircle, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Client, Appointment } from '@/shared/types';
import { useConfirm } from '@/react-app/components/ConfirmDialog';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { Select } from './ui';

interface AppointmentsCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

export default function AppointmentsCalendar({ isOpen, onClose, clients }: AppointmentsCalendarProps) {
  const { confirm } = useConfirm();
  useLockBodyScroll(isOpen);
  
  const [appointments, setAppointments] = useState<(Appointment & { client_name: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Form fields
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState<'service' | 'combo'>('service');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [durationHours, setDurationHours] = useState('1');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Cleanup error message timeouts on unmount
  useEffect(() => {
    return () => {
      setErrorMessage('');
    };
  }, []);

  const services = [
    'Gravação de Áudio',
    'Gravação de áudio curto (vinhetas e comerciais)',
    'Mixagem de Áudio',
    'Masterização de Áudio',
    'Edição de Vídeo',
    'Captação de Vídeo',
    'Edição de Imagens',
    'Transmissão ao Vivo',
  ];

  const combos = [
    'Combo Produção Musical Completa',
    'Combo Clipe Musical Completo',
  ];

  useEffect(() => {
    if (isOpen) {
      loadAppointments();
    }
  }, [isOpen, currentDate, viewMode]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const response = await fetch(`/api/appointments?start_date=${startDate}&end_date=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      // Error loading appointments - silently fail
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (viewMode === 'month') {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      return { startDate, endDate };
    } else if (viewMode === 'week') {
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day;
      const startDate = new Date(year, month, diff).toISOString().split('T')[0];
      const endDate = new Date(year, month, diff + 6).toISOString().split('T')[0];
      return { startDate, endDate };
    } else {
      const startDate = currentDate.toISOString().split('T')[0];
      return { startDate, endDate: startDate };
    }
  };

  const createAppointment = async () => {
    if (!selectedClient || !serviceName || !appointmentDate || !appointmentTime) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient,
          service_name: serviceName,
          service_type: serviceType,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          duration_hours: parseInt(durationHours),
          notes: notes,
        }),
      });

      if (response.ok) {
        await loadAppointments();
        resetForm();
        setShowNewAppointment(false);
      }
    } catch (error) {
      setErrorMessage('Erro ao criar agendamento.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async () => {
    if (!editingAppointment) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: serviceName,
          service_type: serviceType,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          duration_hours: parseInt(durationHours),
          status: editingAppointment.status,
          notes: notes,
        }),
      });

      if (response.ok) {
        await loadAppointments();
        resetForm();
        setEditingAppointment(null);
      }
    } catch (error) {
      setErrorMessage('Erro ao atualizar agendamento.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appointmentId: number, status: Appointment['status']) => {
    setLoading(true);
    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) return;

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: appointment.service_name,
          service_type: appointment.service_type,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          duration_hours: appointment.duration_hours,
          status: status,
          notes: appointment.notes,
        }),
      });

      if (response.ok) {
        await loadAppointments();
      }
    } catch (error) {
      // Error updating status - silently fail
    } finally {
      setLoading(false);
    }
  };

  const deleteAppointment = async (id: number) => {
    const confirmed = await confirm({
      title: 'Excluir Agendamento',
      message: 'Tem certeza que deseja excluir este agendamento?',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });
    
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadAppointments();
      }
    } catch (error) {
      // Error deleting appointment - silently fail
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedClient(null);
    setServiceName('');
    setServiceType('service');
    setAppointmentDate('');
    setAppointmentTime('');
    setDurationHours('1');
    setNotes('');
    setErrorMessage('');
  };

  const editAppointment = (appointment: Appointment & { client_name: string }) => {
    setEditingAppointment(appointment);
    setSelectedClient(appointment.client_id);
    setServiceName(appointment.service_name);
    setServiceType(appointment.service_type as 'service' | 'combo');
    setAppointmentDate(appointment.appointment_date);
    setAppointmentTime(appointment.appointment_time);
    setDurationHours(appointment.duration_hours.toString());
    setNotes(appointment.notes || '');
    setShowNewAppointment(true);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-600';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-yellow-600';
    }
  };

  const getStatusLabel = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return 'Pendente';
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getAppointmentsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const getDayDateString = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const filteredAppointments = selectedDay 
    ? appointments.filter(apt => apt.appointment_date === selectedDay)
    : appointments;

  const addToGoogleCalendar = (appointment: Appointment & { client_name: string }) => {
    const [year, month, day] = appointment.appointment_date.split('-');
    const [hours, minutes] = appointment.appointment_time.split(':');
    
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + appointment.duration_hours);
    
    const formatGoogleDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = '00';
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };
    
    const startDateStr = formatGoogleDate(startDate);
    const endDateStr = formatGoogleDate(endDate);
    
    const title = encodeURIComponent(`${appointment.service_name} - ${appointment.client_name}`);
    const details = encodeURIComponent(
      `Serviço: ${appointment.service_name}\n` +
      `Cliente: ${appointment.client_name}\n` +
      `Tipo: ${appointment.service_type === 'service' ? 'Serviço' : 'Pacote'}\n` +
      `Duração: ${appointment.duration_hours}h\n` +
      (appointment.notes ? `\nObservações: ${appointment.notes}` : '')
    );
    const location = encodeURIComponent('SG Multimídia - São Pedro do Sul - RS');
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}&location=${location}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-2 md:p-4 lg:p-6">
      <div className="bg-slate-800 rounded-none sm:rounded-lg shadow-2xl border border-blue-500/30 w-full h-full sm:h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-900 to-amber-900 border-b border-orange-500/30 p-3 sm:p-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg sm:text-xl font-bold text-white">Agendamentos</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mx-3 sm:mx-4 mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-md flex-shrink-0">
            <p className="text-red-300 text-xs sm:text-sm font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden p-3 sm:p-4">
          {showNewAppointment ? (
            /* New/Edit Appointment Form */
            <div className="p-3 sm:p-4 bg-slate-700/50 rounded-lg border border-blue-500/30">
              <h4 className="text-white font-bold text-sm sm:text-base mb-3">
                {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Cliente"
                  required
                  value={selectedClient || ''}
                  onChange={(e) => setSelectedClient(Number(e.target.value))}
                  disabled={!!editingAppointment}
                  className="text-sm py-2"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </Select>

                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1.5">Tipo de Serviço *</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setServiceType('service');
                        setServiceName('');
                      }}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                        serviceType === 'service' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'
                      }`}
                    >
                      Serviço
                    </button>
                    <button
                      onClick={() => {
                        setServiceType('combo');
                        setServiceName('');
                      }}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                        serviceType === 'combo' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'
                      }`}
                    >
                      Pacote
                    </button>
                  </div>
                </div>

                <Select
                  label={serviceType === 'service' ? 'Serviço' : 'Pacote'}
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="text-sm py-2"
                >
                  <option value="">Selecione</option>
                  {(serviceType === 'service' ? services : combos).map((service) => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </Select>

                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1.5">Data *</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md bg-slate-600 text-white border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1.5">Horário *</label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md bg-slate-600 text-white border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1.5">Duração (horas) *</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md bg-slate-600 text-white border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-blue-300 mb-1.5">Observações</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-md bg-slate-600 text-white border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Observações adicionais sobre o agendamento"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    resetForm();
                    setShowNewAppointment(false);
                    setEditingAppointment(null);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-slate-600 hover:bg-slate-700 text-white rounded-md font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingAppointment ? updateAppointment : createAppointment}
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-md font-semibold transition-all"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : editingAppointment ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </div>
          ) : (
            /* Calendar + Appointments Side by Side */
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 h-full">
              {/* Left Column: Calendar */}
              <div className="lg:w-1/2 flex-shrink-0 overflow-y-auto lg:overflow-y-visible">
                <div className="bg-slate-700/50 rounded-lg border border-blue-500/30 p-2 sm:p-3">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <button
                      onClick={() => navigateDate('prev')}
                      className="p-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h4 className="text-white font-bold text-xs sm:text-sm text-center flex-1 mx-2">
                      {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h4>
                    <button
                      onClick={() => navigateDate('next')}
                      className="p-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                      <div key={idx} className="text-center text-[9px] font-bold text-blue-300 py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {generateCalendarDays().map((day, index) => {
                      if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                      }
                      
                      const dayAppointments = getAppointmentsForDay(day);
                      const hasAppointments = dayAppointments.length > 0;
                      const isSelectedDay = selectedDay === getDayDateString(day);
                      const isTodayDate = isToday(day);
                      
                      return (
                        <button
                          key={day}
                          onClick={(e) => {
                            const dateStr = getDayDateString(day);
                            
                            if (e.detail === 2 || e.ctrlKey || e.metaKey) {
                              resetForm();
                              setAppointmentDate(dateStr);
                              setShowNewAppointment(true);
                              setSelectedDay(null);
                              return;
                            }
                            
                            setSelectedDay(isSelectedDay ? null : dateStr);
                          }}
                          className={`aspect-square rounded border transition-all relative ${
                            isSelectedDay
                              ? 'border-blue-500 bg-blue-600/30'
                              : isTodayDate
                              ? 'border-blue-400/50 bg-blue-900/20'
                              : hasAppointments
                              ? 'border-slate-600 bg-slate-600/30 hover:border-blue-500/50'
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className={`text-[9px] font-semibold ${
                              isSelectedDay ? 'text-white' : isTodayDate ? 'text-blue-300' : 'text-slate-300'
                            }`}>
                              {day}
                            </span>
                            {hasAppointments && (
                              <div className="flex gap-0.5 mt-0.5">
                                {dayAppointments.slice(0, 1).map((apt, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-1 h-1 rounded-full ${
                                      apt.status === 'confirmed' ? 'bg-blue-400' :
                                      apt.status === 'completed' ? 'bg-green-400' :
                                      apt.status === 'cancelled' ? 'bg-red-400' :
                                      'bg-yellow-400'
                                    }`}
                                  />
                                ))}
                                {dayAppointments.length > 1 && (
                                  <span className="text-[7px] text-slate-400">+{dayAppointments.length - 1}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedDay && (
                    <div className="mt-2 pt-2 border-t border-slate-600">
                      <p className="text-blue-300 text-[10px] font-semibold mb-2">
                        {new Date(selectedDay).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            resetForm();
                            setAppointmentDate(selectedDay);
                            setShowNewAppointment(true);
                            setSelectedDay(null);
                          }}
                          className="flex-1 text-[10px] px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-semibold"
                        >
                          + Novo
                        </button>
                        <button
                          onClick={() => setSelectedDay(null)}
                          className="flex-1 text-[10px] px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors font-semibold"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      resetForm();
                      setShowNewAppointment(true);
                    }}
                    className="w-full mt-3 px-3 py-2 text-xs bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Novo Agendamento
                  </button>
                </div>
              </div>

              {/* Right Column: Appointments List */}
              <div className="flex-1 min-w-0 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-12 bg-slate-700/30 rounded-lg border border-slate-600">
                    <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      {selectedDay ? 'Nenhum agendamento neste dia' : 'Nenhum agendamento encontrado'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 hover:border-blue-500/50 transition-all"
                      >
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h5 className="text-white font-bold text-sm break-words">{appointment.service_name}</h5>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusColor(appointment.status)} text-white font-semibold`}>
                                {getStatusLabel(appointment.status)}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-600 text-white font-semibold">
                                {appointment.service_type === 'service' ? 'Serviço' : 'Pacote'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                              <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{appointment.client_name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <Clock className="w-3 h-3" />
                                <span>{appointment.appointment_time} ({appointment.duration_hours}h)</span>
                              </div>
                            </div>
                            {appointment.notes && (
                              <div className="flex items-start gap-1.5 text-slate-400 text-xs mt-1.5 min-w-0">
                                <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2 break-words">{appointment.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1.5 pt-2 border-t border-slate-600 flex-wrap">
                          {appointment.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(appointment.id, 'confirmed')}
                              className="flex-1 min-w-[80px] px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" /> <span className="hidden sm:inline">Confirmar</span><span className="sm:hidden">OK</span>
                            </button>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={() => updateStatus(appointment.id, 'completed')}
                              className="flex-1 min-w-[80px] px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-all flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" /> Concluir
                            </button>
                          )}
                          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                            <button
                              onClick={() => updateStatus(appointment.id, 'cancelled')}
                              className="flex-1 min-w-[80px] px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-all flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3 h-3" /> <span className="hidden sm:inline">Cancelar</span><span className="sm:hidden">X</span>
                            </button>
                          )}
                          <button
                            onClick={() => addToGoogleCalendar(appointment)}
                            className="flex-1 min-w-[100px] px-2 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded text-xs font-semibold transition-all flex items-center justify-center gap-1"
                          >
                            <Calendar className="w-3 h-3" /> <span className="hidden sm:inline">Google</span><span className="sm:hidden">G</span>
                          </button>
                          <button
                            onClick={() => editAppointment(appointment)}
                            className="flex-1 min-w-[70px] px-2 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-semibold transition-all"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteAppointment(appointment.id)}
                            className="flex-1 min-w-[70px] px-2 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-semibold transition-all"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
