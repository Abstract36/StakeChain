// UserInterface.jsx

import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { swapAction, dexAction, poolsAction, farmAction } from '../actions/userInterfaceActions'; // Replace with your actual actions

const useStyles = makeStyles((theme) => ({
    dashboardContainer: {
        padding: theme.spacing(3),
    },
    button: {
        margin: theme.spacing(1),
    },
    panelContainer: {
        marginTop: theme.spacing(3),
    },
    panelItem: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
}));

const UserInterface = ({ dispatchSwap, dispatchDex, dispatchPools, dispatchFarm }) => {
    const classes = useStyles();

    const handleSwap = () => {
        dispatchSwap();
        // Add logic or navigation related to the SWAP functionality
    };

    const handleDex = () => {
        dispatchDex();
        // Add logic or navigation related to the DEX functionality
    };

    const handlePools = () => {
        dispatchPools();
        // Add logic or navigation related to the Pools functionality
    };

    const handleFarm = () => {
        dispatchFarm();
        // Add logic or navigation related to the Farm functionality
    };

    return (
        <div className={classes.dashboardContainer}>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            <div>
                <Button variant="contained" color="primary" className={classes.button} onClick={handleSwap}>
                    SWAP
                </Button>
                <Button variant="contained" color="primary" className={classes.button} onClick={handleDex}>
                    DEX
                </Button>
                <Button variant="contained" color="primary" className={classes.button} onClick={handlePools}>
                    Pools
                </Button>
                <Button variant="contained" color="primary" className={classes.button} onClick={handleFarm}>
                    Farm
                </Button>
            </div>
            <div className={classes.panelContainer}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper className={classes.panelItem}>
                            <Typography variant="h6">SWAP Panel</Typography>
                            {/* Add content related to the SWAP functionality */}
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper className={classes.panelItem}>
                            <Typography variant="h6">DEX Panel</Typography>
                            {/* Add content related to the DEX functionality */}
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper className={classes.panelItem}>
                            <Typography variant="h6">Pools Panel</Typography>
                            {/* Add content related to the Pools functionality */}
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper className={classes.panelItem}>
                            <Typography variant="h6">Farm Panel</Typography>
                            {/* Add content related to the Farm functionality */}
                        </Paper>
                    </Grid>
                </Grid>
            </div>
        </div>
    );
};

const mapDispatchToProps = (dispatch) => ({
    dispatchSwap: () => dispatch(swapAction()),
    dispatchDex: () => dispatch(dexAction()),
    dispatchPools: () => dispatch(poolsAction()),
    dispatchFarm: () => dispatch(farmAction()),
});

export default connect(null, mapDispatchToProps)(UserInterface);
