package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.BloodRequest;
import com.BloodDonorFinderApp.demo.repository.BloodRequestRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DemandForecastServiceTest {

    private final BloodRequestRepository repository = mock(BloodRequestRepository.class);
    private final DemandForecastService service = new DemandForecastService(repository);

    @Test
    void reportsInsufficientHistoryWithoutInventingForecast() {
        when(repository.findAll()).thenReturn(List.of(
                request(1L, "A+", "2026-01-05T10:00:00"),
                request(2L, "A+", "2026-02-05T10:00:00")
        ));

        var result = service.getForecast();

        assertEquals("DATA_INSUFFICIENT", result.status());
        assertFalse(result.dataSufficient());
        assertTrue(result.forecasts().isEmpty());
    }

    @Test
    void forecastsByGroupUsingRecentMonthlyAverageAndDeduplicatesIds() {
        when(repository.findAll()).thenReturn(List.of(
                request(1L, "A+", "2026-01-05T10:00:00"),
                request(2L, "A+", "2026-02-05T10:00:00"),
                request(3L, "A+", "2026-02-06T10:00:00"),
                request(3L, "A+", "2026-02-06T10:00:00"),
                request(4L, "A+", "2026-03-05T10:00:00"),
                request(5L, "O-", "2026-03-06T10:00:00")
        ));

        var result = service.getForecast();

        assertEquals("FORECAST_AVAILABLE", result.status());
        assertEquals("2026-04", result.forecasts().get(0).period());
        assertEquals("A+", result.forecasts().get(0).bloodGroup());
        assertEquals(1.0, result.forecasts().get(0).predictedRequestCount());
        assertNotNull(result.evaluation());
        assertEquals("2026-03", result.evaluation().testPeriod());
        assertTrue(result.evaluation().note().contains("not units"));
    }

    @Test
    void ignoresRecordsWithoutStableDateOrBloodGroup() {
        BloodRequest missingDate = request(1L, "A+", "2026-01-05T10:00:00");
        missingDate.setCreatedAt(null);
        BloodRequest missingGroup = request(2L, "", "2026-02-05T10:00:00");
        when(repository.findAll()).thenReturn(List.of(missingDate, missingGroup));

        var result = service.getForecast();

        assertEquals("DATA_INSUFFICIENT", result.status());
        assertEquals(0, result.actualDemand().size());
    }

    private BloodRequest request(Long id, String group, String timestamp) {
        BloodRequest request = new BloodRequest();
        request.setId(id);
        request.setBloodGroup(group);
        request.setCreatedAt(LocalDateTime.parse(timestamp));
        return request;
    }
}
