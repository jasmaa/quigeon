import React from "react";
import {
  Button,
  Header,
  Container,
  SpaceBetween,
  Grid,
  Box,
} from "@cloudscape-design/components";
import { CollectionDisplay } from "@quigeon/interfaces";
import CollectionFolder from "./CollectionFolder";
import { connect } from "react-redux";
import { createDefaultCollectionDisplay } from "@quigeon/redux/collections-slice";
import { AppDispatch, RootState } from "@quigeon/redux/store";

interface StateProps {
  collectionDisplays: CollectionDisplay[];
}

interface DispatchProps {
  createDefaultCollectionDisplay: () => Promise<void>;
}

interface OwnProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (value: boolean) => void;
}

type Props = StateProps & DispatchProps & OwnProps;

function CollectionNavigation(props: Props) {
  const { isDrawerOpen, setIsDrawerOpen, collectionDisplays } = props;

  return isDrawerOpen ? (
    <div style={{ width: "30em" }}>
      <Container
        header={
          <Grid gridDefinition={[{ colspan: 10 }, { colspan: 2 }]}>
            <Header>Collections</Header>
            <Box textAlign="right">
              <Button
                iconName="angle-left"
                variant="icon"
                onClick={() => {
                  setIsDrawerOpen(false);
                }}
              />
            </Box>
          </Grid>
        }
      >
        <SpaceBetween size="s" direction="vertical">
          {collectionDisplays.map((collectionDisplay, collectionDisplayIdx) => (
            <CollectionFolder
              key={collectionDisplay.collection.id}
              collectionDisplayIdx={collectionDisplayIdx}
            />
          ))}
          <Button
            iconName="add-plus"
            onClick={props.createDefaultCollectionDisplay}
          >
            Add
          </Button>
        </SpaceBetween>
      </Container>
    </div>
  ) : (
    <Button
      iconName="angle-right"
      variant="icon"
      onClick={() => {
        setIsDrawerOpen(true);
      }}
    />
  );
}

const mapStateToProps = (state: RootState) => {
  return {
    collectionDisplays: state.collections.collectionDisplays,
  };
};

const mapDispatchToProps = (dispatch: AppDispatch) => {
  return {
    createDefaultCollectionDisplay: () =>
      dispatch(createDefaultCollectionDisplay()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CollectionNavigation);
