import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { DateRangePicker } from '@mui/x-date-pickers-pro';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-gb';
import { Adventure } from '../types/Adventure';
import { getAdventureById } from '../api/adventures';
import BookingDialog from '../components/booking/BookingDialog';

interface AdventurePlaceDetailParams {
  id: string;
}

const AdventurePlaceDetail: React.FC = () => {
  const { id } = useParams<AdventurePlaceDetailParams>();
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [dateRange, setDateRange] = useState<Dayjs[]>([null, null]);
	const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');


  useEffect(() => {
    if (id) {
      fetchAdventure(id);
    }
  }, [id]);

  const fetchAdventure = async (id: string) => {
    try {
      const adventureData = await getAdventureById(id);
      setAdventure(adventureData);
    } catch (error) {
      console.error('Error fetching adventure:', error);
			setSnackbarMessage('Failed to load adventure details.');
			setSnackbarSeverity('error');
			setIsSnackbarOpen(true);
    }
  };

  const handleOpenBookingDialog = () => {
    setOpenBookingDialog(true);
  };

  const handleCloseBookingDialog = () => {
    setOpenBookingDialog(false);
  };

	const handleSnackbarClose = () => {
		setIsSnackbarOpen(false);
	};


  if (!adventure) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 3, marginTop: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {adventure.name}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <img
              src={adventure.imageUrl}
              alt={adventure.name}
              style={{ width: '100%', height: 'auto', borderRadius: 8 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">Description:</Typography>
            <Typography paragraph>{adventure.description}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography>
              <strong>Location:</strong> {adventure.location}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography>
              <strong>Price:</strong> ${adventure.price}
            </Typography>
          </Grid>
					<Grid item xs={12} md={6}>
						<Typography>
							<strong>Duration:</strong> {adventure.duration} hours
						</Typography>
					</Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleOpenBookingDialog}>
              Book Now
            </Button>
          </Grid>
        </Grid>
      </Paper>

			<BookingDialog
				open={openBookingDialog}
				handleClose={handleCloseBookingDialog}
				item={adventure}
				type="adventure"
			/>
			<Snackbar
				open={isSnackbarOpen}
				autoHideDuration={6000}
				onClose={handleSnackbarClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
					{snackbarMessage}
				</Alert>
			</Snackbar>
    </Container>
  );
};

export default AdventurePlaceDetail;
