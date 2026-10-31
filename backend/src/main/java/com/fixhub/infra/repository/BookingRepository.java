package com.fixhub.infra.repository;

import com.fixhub.infra.entity.Booking;
import com.fixhub.infra.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    // the sessions of one ticket, earliest first
    List<Booking> findByTicketIdOrderByStartTimeAsc(Long ticketId);

    /**
     * Which of these units are held in this window?
     * Overlap rule: new.start < old.end AND new.end > old.start. Back to back is not an overlap.
     */
    @Query("""
            select distinct b.infrastructureId from Booking b
            where b.infrastructureId in :unitIds
              and b.status in :statuses
              and b.startTime < :end
              and b.endTime > :start
            """)
    List<Long> findBusyUnitIds(@Param("unitIds") Collection<Long> unitIds,
                               @Param("statuses") Collection<BookingStatus> statuses,
                               @Param("start") Instant start,
                               @Param("end") Instant end);

    // one unit, one window. used to give a clear message before the database refuses
    @Query("""
            select count(b) > 0 from Booking b
            where b.infrastructureId = :unitId
              and b.status in :statuses
              and b.startTime < :end
              and b.endTime > :start
            """)
    boolean existsOverlap(@Param("unitId") Long unitId,
                          @Param("statuses") Collection<BookingStatus> statuses,
                          @Param("start") Instant start,
                          @Param("end") Instant end);

    // sessions this person still holds (not ended). the limit of 10 uses this
    @Query("""
            select count(b) from Booking b join Ticket t on t.id = b.ticketId
            where t.authorId = :userId
              and b.status in :statuses
              and b.endTime > :now
            """)
    long countUpcomingByAuthor(@Param("userId") Long userId,
                               @Param("statuses") Collection<BookingStatus> statuses,
                               @Param("now") Instant now);

    // approved infra tickets whose approved sessions have all ended. the hourly job closes these
    @Query("""
            select t.id from Ticket t
            where t.type = com.fixhub.ticket.entity.TicketType.INFRA_BOOKING
              and t.status = com.fixhub.ticket.entity.TicketStatus.APPROVED
              and exists (select 1 from Booking b where b.ticketId = t.id
                          and b.status = com.fixhub.infra.entity.BookingStatus.APPROVED)
              and not exists (select 1 from Booking b where b.ticketId = t.id
                              and b.status = com.fixhub.infra.entity.BookingStatus.APPROVED
                              and b.endTime > :now)
            """)
    List<Long> findFinishedTicketIds(@Param("now") Instant now);

    // sessions still holding a slot on one unit. an admin cannot remove the unit or change its size meanwhile
    long countByInfrastructureIdAndStatusInAndEndTimeAfter(Long infrastructureId,
                                                           Collection<BookingStatus> statuses,
                                                           Instant now);

}