package com.campusnav.pin;

import com.campusnav.common.ConflictException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PinServiceTest {

    private final PinRepository repository = mock(PinRepository.class);
    private final PinService service = new PinService(repository);

    @Test
    void acceptsPinBelowDeviceLimit() {
        PinRequest request = request();
        when(repository.countByDeviceIdAndStatus("device-1", PinStatus.pending)).thenReturn(4L);
        when(repository.save(any(PinSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PinDtos.SubmissionResponse response = service.submit(request);

        assertThat(response.status()).isEqualTo(PinStatus.pending);
        verify(repository).lockDevice("device-1");
        verify(repository).save(any(PinSubmission.class));
    }

    @Test
    void rejectsSixthPendingPinForDevice() {
        when(repository.countByDeviceIdAndStatus("device-1", PinStatus.pending)).thenReturn(5L);

        assertThatThrownBy(() -> service.submit(request()))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Too many pending");
    }

    private PinRequest request() {
        return new PinRequest(6.5188, 3.3982, "Mama Put Junction", "landmark",
                null, "Meeting point", "device-1");
    }
}
