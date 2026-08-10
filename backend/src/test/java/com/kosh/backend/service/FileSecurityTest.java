package com.kosh.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class FileSecurityTest {

    private static final byte[] PNG = new byte[] {
            (byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0
    };

    @Test
    void trustsMagicBytesInsteadOfBrowserMimeType() throws Exception {
        var upload = new MockMultipartFile("file", "avatar.jpg", "text/html", PNG);
        var stored = FileSecurity.validate(upload, FileSecurity.Kind.IMAGE);

        assertThat(stored.contentType()).isEqualTo("image/png");
        assertThat(stored.filename()).isEqualTo("avatar.png");
    }

    @Test
    void removesPathsControlsAndDoubleExtensions() throws Exception {
        var upload = new MockMultipartFile("file", "../report.pdf\r\nX-Evil: yes.jpg",
                "image/jpeg", PNG);
        var stored = FileSecurity.validate(upload, FileSecurity.Kind.IMAGE);

        assertThat(stored.filename()).isEqualTo("report.png");
        assertThat(stored.filename()).doesNotContain("..", "\r", "\n");
    }

    @Test
    void rejectsSvgAndMimeSpoofing() {
        var svg = new MockMultipartFile("file", "safe.png", "image/png",
                "<svg onload=alert(1)>".getBytes());
        assertThatThrownBy(() -> FileSecurity.validate(svg, FileSecurity.Kind.IMAGE))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsPdfWhereAnImageIsRequired() {
        var pdf = new MockMultipartFile("file", "logo.pdf", "image/png",
                "%PDF-1.7".getBytes());
        assertThatThrownBy(() -> FileSecurity.validate(pdf, FileSecurity.Kind.IMAGE))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsOversizedFilesBeforeReadingThem() {
        var oversized = new MockMultipartFile("file", "huge.png", "image/png",
                new byte[(int) FileSecurity.MAX_IMAGE_BYTES + 1]);
        assertThatThrownBy(() -> FileSecurity.validate(oversized, FileSecurity.Kind.IMAGE))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void validatesBase64UploadsWithTheSamePolicy() {
        String encoded = java.util.Base64.getEncoder().encodeToString(PNG);
        var stored = FileSecurity.validateBase64(encoded, "logo.svg", FileSecurity.Kind.IMAGE);

        assertThat(stored.contentType()).isEqualTo("image/png");
        assertThatThrownBy(() -> FileSecurity.validateBase64("not base64!", "logo.png",
                FileSecurity.Kind.IMAGE)).isInstanceOf(IllegalArgumentException.class);
    }
}
