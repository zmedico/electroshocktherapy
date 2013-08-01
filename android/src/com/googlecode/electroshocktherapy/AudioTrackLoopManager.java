package com.googlecode.electroshocktherapy;

import java.io.IOException;
import java.io.InputStream;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;

public class AudioTrackLoopManager {

	private AudioTrack audioTrack;
	private float volume;
	private Context context;
	private int resId;
	private int loopEnd;
	private int bytesPerSample = 2;  // 16BIT

	public AudioTrackLoopManager(Context context, int resId) {
		this.context = context;
		this.resId = resId;
	}

	private AudioTrack getAudioTrack() {
		if (audioTrack == null)
		{
			try {
				AssetFileDescriptor afd =
					context.getResources().openRawResourceFd(resId);
				int dataLength = (int)afd.getDeclaredLength();
				InputStream in = afd.createInputStream();
				// skip the WAV header
				in.skip(44);
				dataLength -= 44;
				int bytesPerSample = 2; // 16BIT
				loopEnd = dataLength / bytesPerSample;
				audioTrack = new AudioTrack(AudioManager.STREAM_MUSIC,
					44100, AudioFormat.CHANNEL_OUT_MONO,
					AudioFormat.ENCODING_PCM_16BIT, dataLength,
					AudioTrack.MODE_STATIC);
				byte[] buf = new byte[dataLength];
				int offset, count, written;
				offset = 0;
				while ((count = in.read(buf, offset, dataLength - offset)) != -1)
					offset += count;
				written = audioTrack.write(buf, 0, dataLength);
				in.close();
				afd.close();
			}
			catch (IOException e) {
				e.printStackTrace();
				audioTrack = null;
			}
		}
		return audioTrack;
	}

	public void release() {
		if (audioTrack != null) {
			audioTrack.release();
			audioTrack = null;
		}
	}

	public void pause() {
		if (audioTrack != null) {
			audioTrack.pause();
			audioTrack.flush();
		}
	}

	public void setVolume(float volume) {
		this.volume = volume;
	}

	public void play() {
		AudioTrack audioTrack = getAudioTrack();
		if (audioTrack != null)
		{
			audioTrack.reloadStaticData();
			audioTrack.setStereoVolume(volume, volume);
			audioTrack.setLoopPoints(0, loopEnd, -1);
			audioTrack.play();
		}
	}
}
