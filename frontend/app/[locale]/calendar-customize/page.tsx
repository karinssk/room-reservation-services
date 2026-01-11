'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

// Helper to map Google Event to BigCalendar Event
const mapToCalendarEvent = (googleEvent: any) => {
    return {
        id: googleEvent.id,
        title: googleEvent.summary || 'No Title',
        start: new Date(googleEvent.start.dateTime || googleEvent.start.date),
        end: new Date(googleEvent.end.dateTime || googleEvent.end.date),
        allDay: !googleEvent.start.dateTime, // If no dateTime, it's an all-day event
        resource: googleEvent,
    };
};

const CalendarCustomizePage = () => {
    type CalendarEvent = {
        id: string;
        title: string;
        start: Date;
        end: Date;
        allDay: boolean;
        resource?: any;
    };

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            // Construct API URL - assuming frontend proxy or direct backend URL
            // Since we don't have a proxy set up in next.config.ts yet, we might need absolute URL or setup proxy
            // Using environment variable for backend URL is best practice
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4022';
            const res = await fetch(`${backendUrl}/api/calendar/events`);

            if (!res.ok) {
                throw new Error('Failed to fetch events');
            }

            const data = await res.json();
            // data.items contains the list of events from Google API response
            const calendarEvents = (data.items || []).map(mapToCalendarEvent);
            setEvents(calendarEvents);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = ({ start, end }: any) => {
        const title = window.prompt('New Event Name');
        if (title) {
            // Implement create event logic here
            // createEvent({ title, start, end });
            alert(`Ideally create event "${title}" from ${start} to ${end}. (Implementation pending)`);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading calendar...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="container mx-auto py-8 px-4 h-screen max-h-[90vh] flex flex-col">
            <h1 className="text-3xl font-bold mb-6 text-center">Custom Google Calendar Integration</h1>
            <div className="flex-grow bg-white p-4 shadow-lg rounded-lg">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={(event) => alert(event.title)}
                />
            </div>
        </div>
    );
};

export default CalendarCustomizePage;
